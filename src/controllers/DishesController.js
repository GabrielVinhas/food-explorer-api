const knex = require("../database/knex");
const DiskStorage = require("../providers/DiskStorage");

class DishesController {
  async create(request, response) {
    const { title, description, category, price, ingredients } = request.body;

    const { filename: imageFilename } = request.file;

    const diskStorage = new DiskStorage();

    const filename = await diskStorage.saveFile(imageFilename);

    const dish_id = await knex("dishes").insert({
      image: filename,
      title,
      description,
      category,
      price
    });

    const hasOnlyOneIngredient = typeof(ingredients) === "string";

    let ingredientsInsert
    if (hasOnlyOneIngredient) {
      ingredientsInsert = {
        name: ingredients,
        dish_id
      }

    } else if (ingredients.length > 1) {
      ingredientsInsert = ingredients.map(ingredient => {
        return {
          name : ingredient,
          dish_id
        }
      });

    } else {
      return 
    }

    await knex("ingredients").insert(ingredientsInsert);

    return response.status(201).json();
  }

  async update(request, response) {
    const { title, description, category, price, ingredients } = request.body;
    const { id } = request.params;

    const { filename: imageFilename } = request.file;

    const diskStorage = new DiskStorage();

    const dish = await knex("dishes").where({ id }).first();

    if (dish.image) {
      await diskStorage.deleteFile(dish.image);
    }

    const filename = await diskStorage.saveFile(imageFilename);

    dish.image = filename;
    dish.title = title ?? dish.title;
    dish.description = description ?? dish.description;
    dish.category = category ?? dish.category;
    dish.price = price ?? dish.price;

    await knex("dishes").where({ id }).update(dish);
    await knex("dishes").where({ id }).update('updated_at', knex.fn.now());

    const hasOnlyOneIngredient = typeof(ingredients) === "string";

    let ingredientsInsert
    if (hasOnlyOneIngredient) {
      ingredientsInsert = {
        dish_id: dish.id,
        name: ingredients
      }
    } else if (ingredients.length > 1) {
      ingredientsInsert = ingredients.map(ingredient => {
        return {
          dish_id: dish.id,
          name : ingredient
        }
      })
      
      await knex("ingredients").where({ dish_id: id}).delete()
      await knex("ingredients").where({ dish_id: id}).insert(ingredientsInsert)
    }

    return response.status(200).json();
  }

  async index(request, response) {
    const { title, ingredients } = request.query;

    let dishes;

    if (ingredients) {
      const filterIngredients = ingredients.split(',').map(ingredient => ingredient.trim());

      dishes = await knex("ingredients")
        .select([
          "dishes.id",
          "dishes.title",
          "dishes.description",
          "dishes.category",
          "dishes.price",
          "dishes.image",
        ])
        .whereLike("dishes.title", `%${title}%`)
        .whereIn("name", filterIngredients)
        .innerJoin("dishes", "dishes.id", "ingredients.dish_id")
        .groupBy("dishes.id")
        .orderBy("dishes.title")
    } else {
      dishes = await knex("dishes")
        .whereLike("title", `%${title}%`)
        .orderBy("title")
    }

    const dishesIngredients = await knex("ingredients") 
    const dishesWithIngredients = dishes.map(dish => {
      const dishIngredient = dishesIngredients.filter(ingredient => ingredient.dish_id === dish.id);

      return {
        ...dish,
        ingredients: dishIngredient
      }
    })
    
    return response.status(200).json(dishesWithIngredients);
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("dishes").where({ id }).delete();

    return response.status(200).json();
  }

  async show(request, response) {
    const { id } = request.params;

    const dish = await knex("dishes").where({ id }).first();
    const ingredients = await knex("ingredients").where({ dish_id: id }).orderBy("name");

    return response.status(200).json({
      ...dish,
      ingredients,
    });
  }
}

module.exports = DishesController;