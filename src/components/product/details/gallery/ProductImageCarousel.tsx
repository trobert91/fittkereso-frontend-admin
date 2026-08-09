"use client";

import { ProductModel } from "@/models/product-model";
import { Carousel } from "@mantine/carousel";
import chain from "lodash";
import Image from "next/image";
import { useMemo } from "react";

export const ProductImageCarousel = ({
  product,
}: {
  product: ProductModel;
}) => {
  const images = useMemo(() => {
    return chain(product.images || [])
      .filter((img) => !!img.url)
      .orderBy("order", "asc")
      .value();
  }, [product.images]);

  return (
    <Carousel
      withIndicators
      height={400}
      slideSize="70%"
      slideGap="sm"
      controlsOffset="sm"
      controlSize={25}
      withControls
    >
      {images.map((img) => (
        <Carousel.Slide
          key={img.id}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            src={img.url ?? img.sourceUrl!}
            alt={img.fileName}
            style={{ objectFit: "contain", borderRadius: "md" }}
            height={380}
            width={600}
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
};
