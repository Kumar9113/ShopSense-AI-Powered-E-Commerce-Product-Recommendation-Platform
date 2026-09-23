"use client"

import InputComponent from "@/components/FormElements/InputComponent";
import SelectComponent from "@/components/FormElements/SelectComponent";
import TileComponent from "@/components/FormElements/TileComponent";
import ComponentLevelLoader from "@/components/Loader/componentlevel";

import Notification from "@/components/Notification";
import { GlobalContext } from "@/context";
import { addNewProduct, updateAProduct } from "@/services/product";
import { uploadImage } from "@/services/storage";
import { AvailableSizes, adminAddProductformControls } from "@/utils";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const initialFormData = {
    name: "",
    price: 0,
    description: "",
    category: "men",
    sizes: [],
    deliveryInfo: "",
    onSale: "no",
    imageUrl: "",
    priceDrop: 0,
};

export default function AdminAddNewProduct() {
    const router = useRouter()


    const [formData, setFormData] = useState(initialFormData)
    const {
        componentLevelLoader,
        setComponentLevelLoader,
        currentUpdatedProduct,
        setCurrentUpdatedProduct,
    } = useContext(GlobalContext);


    useEffect(() => {
        if (currentUpdatedProduct !== null) setFormData(currentUpdatedProduct);
    }, [currentUpdatedProduct]);



    async function handleImage(event) {
        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        try {
            setComponentLevelLoader({ loading: true, id: "" });

            const { url } = await uploadImage(selectedFile, "ecommerce");

            setFormData({
                ...formData,
                imageUrl: url,
            });
        } catch (error) {
            console.log(error);
            toast.error(error.message || "Failed to upload image ! Please try again", {
                position: toast.POSITION.TOP_RIGHT,
            });
        } finally {
            setComponentLevelLoader({ loading: false, id: "" });
        }
    }

    function handleTileClick(getCurrentItem) {
        let cpySizes = [...formData.sizes];
        const index = cpySizes.findIndex((item) => item.id === getCurrentItem.id);

        if (index === -1) {
            cpySizes.push(getCurrentItem);
        } else {
            cpySizes = cpySizes.filter((item) => item.id !== getCurrentItem.id);
        }

        setFormData({
            ...formData,
            sizes: cpySizes,
        });
    }
    async function handleAddProduct() {


        setComponentLevelLoader({ loading: true, id: '' })

        const res =
            currentUpdatedProduct !== null
                ? await updateAProduct(formData)
                : await addNewProduct(formData);
        // console.log(res);

        if (res.success) {
            setComponentLevelLoader({ loading: false, id: "" });
            toast.success(res.message, {
                position: toast.POSITION.TOP_RIGHT,
            });

            setFormData(initialFormData);
            setCurrentUpdatedProduct(null)
            setTimeout(() => {
                router.push("/admin-view/all-products");
            }, 1000);
        } else {
            toast.error(res.message, {
                position: toast.POSITION.TOP_RIGHT,
            });
            setComponentLevelLoader({ loading: false, id: "" });
            setFormData(initialFormData);
        }
    }


    console.log(formData);
    console.log(currentUpdatedProduct);
    console.log(componentLevelLoader)

    return (
        <div className="w-full mt-5 mr-0 mb-0 ml-0 relative">
            <div className="flex flex-col items-start justify-start p-10 bg-white shadow-2xl rounded-xl relative">
                <div className="w-full mt-6 mr-0 mb-0 ml-0 space-y-8">
                    <input
                        accept="image/*"
                        max="1000000"
                        type="file"
                        onChange={handleImage}
                    />


                    <div className="flex gap-2 flex-col">
                        <label>Available sizes</label>
                        <TileComponent
                            selected={formData.sizes}
                            onClick={handleTileClick}
                            data={AvailableSizes}
                        />
                    </div>
                    {adminAddProductformControls.map((controlItem) =>
                        controlItem.componentType === "input" ? (
                            <InputComponent
                                type={controlItem.type}
                                placeholder={controlItem.placeholder}
                                label={controlItem.label}
                                value={formData[controlItem.id]}
                                onChange={(event) => {
                                    setFormData({
                                        ...formData,
                                        [controlItem.id]: event.target.value,
                                    });
                                }}
                            />
                        ) : controlItem.componentType === "select" ? (
                            <SelectComponent
                                label={controlItem.label}
                                options={controlItem.options}
                                value={formData[controlItem.id]}
                                onChange={(event) => {
                                    setFormData({
                                        ...formData,
                                        [controlItem.id]: event.target.value,
                                    });
                                }}
                            />
                        ) : null
                    )}
                    <button
                        onClick={handleAddProduct}
                        className="inline-flex w-full items-center justify-center bg-brand hover:bg-brand-dark transition-colors px-6 py-4 text-lg text-white font-medium uppercase tracking-wide"
                    > {componentLevelLoader && componentLevelLoader.loading ? (
                        <ComponentLevelLoader
                            text={currentUpdatedProduct !== null ? 'Updating Product' : "Adding Product"}
                            color={"#ffffff"}
                            loading={componentLevelLoader && componentLevelLoader.loading}
                        />
                    ) : currentUpdatedProduct !== null ? (
                        "Update Product"
                    ) : (
                        "Add Product"
                    )}

                    </button>
                </div>

            </div>
            <Notification />
        </div>
    );
}
