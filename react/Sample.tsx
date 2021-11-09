const schema = yup.object().shape({
  name: yup.string().min(1, "Please enter a name for the item."),
  shortDesc: yup
    .string()
    .min(1, "Please enter a short description for the item."),
  longDesc: yup
    .string()
    .min(1, "Please enter a long description for the item."),
  price: yup
    .number()
    .positive("Please enter a valid price.")
    .typeError("Please enter a valid price."),
  cost: yup
    .number()
    .positive("Please enter a valid cost.")
    .typeError("Please enter a valid cost."),
  spicy: yup.boolean(),
  vegan: yup.boolean(),
  vegetarian: yup.boolean(),
  glutenFree: yup.boolean(),
  beverage: yup.boolean(),
  active: yup.boolean(),
  tags: yup.array(),
  allergens: yup.array(),
});

interface ItemModalProps extends WithStyles<typeof globalStyles> {
  open: boolean;
  onClose(): void;
  onSaveSuccess?(): void;
  itemID: string;
}

const ItemModal: FC<ItemModalProps> = ({
  open,
  onClose,
  onSaveSuccess,
  itemID,
  classes,
}) => {
  const { client } = useGQLClient();
  const { conceptID } = useConcept();
  const queryClient = useQueryClient();
  const { data: item, isLoading: isItemLoading } = useGetItemQuery(
    client,
    {
      id: itemID,
    },
    { select: (data) => data.getItem }
  );
  const updateItem = useUpdateItemMutation(client);
  const deleteItem = useDeleteItemMutation(client);
  const key = useGetItemQuery.getKey({
    id: itemID,
  });
  const itemsKey = useListItemsQuery.getKey({ concept: conceptID });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [editItemState, setEditItemState] = useState({} as UpdateItemInput);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const handleClose = () => {
    onClose();
  };

  const handleExited = () => {};

  const handleEditClick = () => {
    setEditItemState({});
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    schema
      .validate(editItemState, { abortEarly: false })
      .then(async () => {
        // if (editItemState.substitutions) {
        //   await Promise.all(
        //     editItemState.substitutions.map((sub) =>
        //       createSub
        //         .mutateAsync({
        //           input: {
        //             name: sub.name,
        //           },
        //           item: item.id,
        //         })
        //         .then(
        //           async (data) =>
        //             await Promise.all(
        //               sub.options.map((o) =>
        //                 createSubOption.mutateAsync({
        //                   input: {
        //                     substitution: data.createSubstitution.id,
        //                     name: o.name,
        //                     priceChange: o.priceChange,
        //                   },
        //                 })
        //               )
        //             )
        //         )
        //         .catch((err) => {
        //           console.log(err);
        //         })
        //     )
        //   );
        // }
        // delete editItemState.substitutions;
        // delete editItemState.addOns;
        updateItem.mutate(
          {
            id: item.id,
            input: editItemState as unknown as UpdateItemInput,
          },
          {
            onSuccess: () => {
              setIsEditing(false);
              onSaveSuccess && onSaveSuccess();
            },
            onSettled: () => {
              queryClient.invalidateQueries(key);
            },
          }
        );
      })
      .catch((err) => {
        let _errors = {};
        err.inner.forEach(
          (inner) => (_errors = { ..._errors, [inner.path]: inner.message })
        );
        setErrors(_errors);
      });
  };

  const handleEditItemChange = (key: string, value: any) => {
    setEditItemState({ ...editItemState, [key]: value });
  };

  const handleImageSave = (file: File) => {
    uploadImage(file, `${conceptID}/items`).then((data) => {
      updateItem.mutate(
        {
          id: item.id,
          input: { photo: data.key },
        },
        {
          onSuccess: () => {
            setIsEditingImage(false);
          },
          onSettled: () => {
            queryClient.invalidateQueries(key);
          },
        }
      );
    });
  };

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${item.name}? This cannot be undone!`
      )
    )
      deleteItem.mutate(
        {
          id: item.id,
        },
        {
          onSuccess: () => {
            onClose();
          },
          onSettled: () => {
            queryClient.removeQueries(key);
            queryClient.invalidateQueries(itemsKey);
          },
        }
      );
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth="lg"
        fullWidth
        TransitionProps={{
          onExit: handleExited,
          unmountOnExit: true,
          mountOnEnter: true,
        }}
      >
        {isItemLoading ? (
          <Loader />
        ) : (
          <Card style={{ overflow: "auto" }}>
            <CardHeader
              avatar={
                <Badge
                  overlap="rectangle"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  badgeContent={
                    <IconButton
                      className={classes.imageEditIconButton}
                      size="small"
                      onClick={() => setIsEditingImage(true)}
                    >
                      <EditIcon />
                    </IconButton>
                  }
                >
                  <Avatar
                    variant="rounded"
                    alt="Item Image"
                    style={{
                      height: 150,
                      width: 150,
                    }}
                    src={item.photo}
                  />
                </Badge>
              }
              title={
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <Typography variant="h6">
                      {!isEditing ? item.name : "Edit Item"}
                    </Typography>
                  </Grid>
                  {!isEditing && (
                    <Grid item>
                      <Chip
                        variant="outlined"
                        color="primary"
                        size="small"
                        label={item.active ? "Active" : "Inactive"}
                      />
                    </Grid>
                  )}
                </Grid>
              }
              subheader={!isEditing && item.shortDesc}
              action={
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              }
            />
            <CardContent>
              {!isEditing ? (
                <ItemModalContent item={item as Item} />
              ) : (
                <ItemModalEditContent
                  onEdit={handleEditItemChange}
                  editState={editItemState}
                  item={item as Item}
                  errors={errors}
                />
              )}
            </CardContent>
            <CardActions>
              <Grid container spacing={2} justify="flex-end">
                {!isEditing ? (
                  <>
                    <Tooltip
                      disableFocusListener={item.categories.length === 0}
                      disableHoverListener={item.categories.length === 0}
                      disableTouchListener={item.categories.length === 0}
                      title="Cannot delete an item that is part of a menu"
                    >
                      <Grid item>
                        <Button
                          disabled={item.categories.length > 0}
                          onClick={handleDeleteClick}
                        >
                          Delete
                        </Button>
                      </Grid>
                    </Tooltip>
                    <Grid item>
                      <Button color="primary" onClick={handleEditClick}>
                        Edit
                      </Button>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item>
                      <Button color="primary" onClick={handleCancelClick}>
                        Cancel
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        color="primary"
                        variant="contained"
                        onClick={handleSaveClick}
                        disabled={Object.keys(editItemState).length === 0}
                      >
                        Save
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardActions>
          </Card>
        )}
      </Dialog>
      <ImageModal
        open={isEditingImage}
        onClose={() => setIsEditingImage(false)}
        onSave={handleImageSave}
        aspectRatio={1 / 1}
      />
    </>
  );
};

export default withStyles(globalStyles)(ItemModal);
