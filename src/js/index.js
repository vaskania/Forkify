// Global app controller
import { elements, renderLoader, clearLoader } from "./views/base";
import Search from "./modules/Search";
import Recipe from "./modules/Recipe";
import List from "./modules/List";
import Likes from "./modules/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";

/* 
1. Search Object
2. Current recipe Object
3. Shopping List Object
4. Liked recipes 
*/

const state = {};

/* Search Controller */

const controlSearch = async () => {
  // 1) Get Query from view
  const query = searchView.getInput();

  if (query) {
    // 2) New Search Object and add state
    state.search = new Search(query);

    // 3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchResList);

    // 4) Search for recipes
    await state.search.getResults();
    clearLoader();

    // 5) Render results on UI
    searchView.renderRecipes(state.search.result);
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = +btn.dataset.goto;
    searchView.clearResults();
    searchView.renderRecipes(state.search.result, goToPage);
  }
});

/* Recipe Controller */

const controlRecipe = async () => {
  // get ID from URL
  const id = window.location.hash.replace("#", "");

  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Hightligted selected search items
    if (state.search) searchView.highlightSelected(id);

    // Create New recipe object
    state.recipe = new Recipe(id);

    try {
      // Get Recipe Data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calculate Servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render Recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      alert("Error Recipe");
    }
  }
};

/* Shopping List Controller */
const controllerList = () => {
  //Create a new list
  if (!state.list) state.list = new List();

  // Prepare UI for changes
  listView.clearList();

  //Add each ingredients
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItems(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

/* Likes Controller */
const controllerLike = () => {
  if (!state.likes) state.likes = new Likes();

  const currentID = state.recipe.id;

  if (!state.likes.isLiked(currentID)) {
    // Add Like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    // Toggle to the btn
    likesView.toggleLikeBtn(true);

    // Add Like to UI
    likesView.renderLike(newLike);
  } else {
    // Remove Like from the state
    state.likes.deleteLike(currentID);

    // Toggle to the btn
    likesView.toggleLikeBtn(false);

    // Remove like from UI

    likesView.deleteLike(currentID);
  }

  // Toggle like menu
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

["hashchange", "load"].forEach((event) =>
  addEventListener(event, controlRecipe)
);

// Restore Liked recipes on page
addEventListener("load", () => {
  state.likes = new Likes();

  // Restore Likes
  state.likes.readStorage();

  // Toggle like menu
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Rendering the existing likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

//Handle delete and update list item event
elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // Delete from state
    state.list.deleteItem(id);
    // Delete from UI
    listView.deleteItem(id);
  } else if (
    e.target.matches(".shopping__count__value, .shopping__count__value *")
  ) {
    // Update
    const val = +e.target.value;
    state.list.updateCount(id, val);
  }
});

// Handling recipe button click
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // Decrease
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    // Increase
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn__add, .recipe__btn__add *")) {
    // Shopping List
    controllerList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    // Likes list
    controllerLike();
  }
});
