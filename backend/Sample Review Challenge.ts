// IGNORE IMPORT ERRORS
const foodHallQueries: QueryResolvers = {
  getSearchItems: async (_, args) => {
    // Things I would pick out here:
    // 1. The commented console log should be removed
    // 2. I would change/simplify the match to the following:
    // const match = {
    //   active: { $eq: true },
    //   deleted: { $eq: false },
    //   ...(args.filters.includes('vegan') && { vegan: { $eq: true } }),
    //   ...(args.filters.includes('vegetarian') && { vegetarian: { $eq: true } }),
    //   ...(args.filters.includes('glutenFree') && { glutenFree: { $eq: true } }),
    // }
    // This would remove the veganMath, vegetarianMatch, and glutenFreeMatch and only add them if needed rather than always adding them unnecessarily

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
  // Things I would pick out here:
  // 1. This is a key that SHOULD NOT be stored in version control and should not be in the code like this. Really we shouldn't even make the key accessible through our API like this (it is a workaround for now).
  // This is most important thing I would look from from this code sample.
  getPlacesKey: async (_, _args) => {
    return "AIzaSyBVyArZ3sJVx0tKhXFchG73vYP_tww2Nxs";
  },
};

export default foodHallQueries;
