import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "react-query";
import {
  BackButton,
  Box,
  Card,
  Feature,
  Flex,
  Heading,
  LoadingModule,
  ViewBag,
} from "../../../core";
import { getCategory } from "../../api";
import { useAuth } from "../../providers/AuthProvider";
import { useCheckout } from "../../providers/CheckoutProvider";
import { Category, Item, MarketItem } from "../../types/core";

type TMarketSectionScreen = {
  route: {
    params: {
      section: {
        name: any;
        categoryID: string;
      };
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (
      route: string,
      params: { screen?: string; item: Item | MarketItem }
    ) => void;
  };
};
const MarketSectionScreen: React.FC<TMarketSectionScreen> = (props) => {
  const { addItem, bagItems } = useCheckout();
  const { admin } = useAuth();
  const [activeMarketItems, setActiveMarketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    navigation: { goBack },
    navigation,
    route,
  } = props;
  const { section } = route.params;

  const { data: category, isLoading } = useQuery<Category>(
    ["categoryImages", section.categoryID],
    () => getCategory({ id: section.categoryID, resize: resize }),
    { enabled: !!section.categoryID, refetchInterval: 5000 }
  );
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);
  const resize = {
    width: 500,
    height: 500,
    fit: "fill",
  };

  useEffect(() => {
    category?.items &&
      setActiveMarketItems(
        category?.items
          .filter(
            (item) =>
              item.active &&
              item.price > 0 &&
              item.id !== category?.items.map((item) => item.id)
          )
          .map((item) => (item = { ...item, marketItem: true }))
      );
  }, [category?.items]);

  return (
    <View style={{ height: "100%" }}>
      {loading ? (
        <SafeAreaView>
          <ScrollView>
            {category?.feature ? (
              <Feature
                item={{ ...category?.feature, marketItem: true }}
                onPress={() =>
                  navigation.navigate("MarketItem", {
                    item: category?.feature,
                  })
                }
                backButton={goBack}
                plusButton={
                  category?.feature?.totalQty > 0 &&
                  (() => addItem({ ...category?.feature, marketItem: true }, 1))
                }
              />
            ) : (
              <Flex mb={20}>
                <BackButton onBack={() => navigation.goBack()} />
              </Flex>
            )}
            <Flex>
              <Heading
                variant="h2"
                pl={20}
                pb={10}
                pt={15}
                mt={category?.feature ? 0 : 60}
              >
                {section.name}
              </Heading>
              <Flex
                flexDirection="row"
                flexWrap="wrap"
                justifyContent="space-around"
                mb={60}
              >
                {category?.items &&
                  category?.items
                    ?.filter((item) => item.active && item.price > 0)
                    .map((item) => {
                      return (
                        <Box key={item.id}>
                          <Card
                            variant="small"
                            img={item.photo}
                            title={item.name}
                            price={item.price}
                            rating={item.rating}
                            onPress={() =>
                              navigation.navigate("MarketItem", {
                                item: item,
                              })
                            }
                          />
                        </Box>
                      );
                    })}
              </Flex>
            </Flex>
          </ScrollView>
          {bagItems.length > 0 && <ViewBag bottom={20} />}
        </SafeAreaView>
      ) : (
        <LoadingModule visible={loading} />
      )}
    </View>
  );
};

export default MarketSectionScreen;
