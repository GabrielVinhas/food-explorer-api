const knex = require("../database/knex");

class CartsController {
  async create(request, response) {
    const { status, paymentMethod, orders } = request.body;
    const user_id = request.user.id;

    const cart_id = await knex("carts").insert({
      status,
      paymentMethod,
      user_id
    })

    const ordersInsert = orders.map(order => {

      return {
        title: order.title,
        quantity: order.quantity,
        cart_id,
        dish_id: order.id
      }
    });

    await knex("cartItems").insert(ordersInsert);
    return response.status(201).json();
  }

  async update(request, response) {
    const { id, status } = request.body;

    await knex("carts").update({status}).where({ id })
    
    return response.status(201).json();
  }

  async index(request, response) {
    const allCarts = await knex("carts")
    const orders = await knex("cartItems")  

    const cartsWithOrders = allCarts.map(cart => {
      const cartOrder = orders.filter(order => order.cart_id === cart.id)

      return {
        ...cart,
        orders: cartOrder
      }
    })
    return response.status(201).json(cartsWithOrders)
  }

  async show(request, response) {
    const { id } = request.params;

    const cart = await knex("carts").where({ user_id: id }).first();
    const orders = await knex("cartItems").where({ cart_id: id})

    return response.status(201).json({
      ...cart,
      orders,
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("carts").where({ user_id: id }).delete();

    return response.status(201).json();
  }
}

module.exports = CartsController;