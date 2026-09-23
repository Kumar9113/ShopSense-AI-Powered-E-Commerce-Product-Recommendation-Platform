"use client";

import { useRouter } from "next/navigation";
import ProductButton from "./ProductButtons";
import ProductTile from "./ProductTile";
import { useContext, useEffect } from "react";
import Notification from "../Notification";
import { GlobalContext } from "@/context";

export default function CommonListing({ data }) {
  const router = useRouter();
  const { showCartModal } = useContext(GlobalContext)


  // const dummy = [{
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "yes",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },
  // {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // }, {
  //   _id: "6520db4348f5257ec91d7ed2",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "yes",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // },


  // {
  //   _id: " 6520db4348f5257ec91d7ed3",
  //   name: "Kumar",
  //   description: "bugfugdyu",
  //   price: 88990,
  //   category: "men",
  //   sizes: [
  //     {
  //       id: "m",
  //       label: "M"
  //     }],
  //   deliveryInfo: "bhfdugdyug",
  //   onSale: "no",
  //   priceDrop: 11,
  //   imageUrl: " https://firebasestorage.googleapis.com/v0/b/next-js-ecommerce-85213.appspot.com/o/ecommerce%2FSIGN.jpg-1696652075627-m44nzw8iki?alt=media&token=8ed52d65-b555-4069-aea4-388398231052",

  // }
  // ]

  useEffect(() => {
    router.refresh();
    console.log(showCartModal)
  }, [showCartModal]);

  return (
    <section className="bg-canvas py-12 sm:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4 lg:mt-16">
          {data && data.length
            ? data.map((item) => (
              <article
                className="relative flex flex-col overflow-hidden bg-white border border-brand-light transition-colors hover:border-brand cursor-pointer"
                key={item._id}
              >
                <ProductTile item={item} />
                <ProductButton item={item} />
              </article>
            ))
            : null}
        </div>
      </div>
      <Notification />
    </section>
  );
}
