// IGNORE IMPORT ERRORS
const foodHallQueries: QueryResolvers = {
  getSearchItems: async (_, args) => {
    let veganMatch: unknown = { $limit: 1000 };
    let vegetarianMatch: unknown = { $limit: 1000 };
    let glutenfreeMatch: unknown = { $limit: 1000 };

    if (args.tags) {
      if (args.tags.includes("vegan")) {
        veganMatch = { $match: { vegan: { $eq: true } } };
      }
      if (args.tags.includes("vegetarian")) {
        vegetarianMatch = { $match: { vegetarian: { $eq: true } } };
      }
      if (args.tags.includes("glutenfree")) {
        glutenfreeMatch = { $match: { glutenFree: { $eq: true } } };
      }
    }

    const match = {
      active: { $eq: true },
      deleted: { $eq: false },
    };
    //console.log(match)

    return await SearchItem.aggregate([
      {
        $search: {
          index: "searchItems",
          text: {
            query: args.text,
            fuzzy: {},
            path: {
              wildcard: "*",
            },
          },
        },
      },
      {
        $match: match,
      },
      veganMatch,
      vegetarianMatch,
      glutenfreeMatch,
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          itemId: 1,
          itemType: 1,
          name: 1,
          photo: 1,
          shortDesc: 1,
          longDesc: 1,
          price: 1,
          active: 1,
          deleted: 1,
          vegan: 1,
          vegetarian: 1,
          glutenFree: 1,
          tags: 1,
          score: { $meta: "searchScore" },
        },
      },
      {
        $sort: {
          score: -1,
        },
      },
    ]);
  },
  getPlacesKey: async (_, _args) => {
    return "AIzaSyBVyArZ3sJVx0tKhXFchG73vYP_tww2Nxs";
  },
};

export default foodHallQueries;
