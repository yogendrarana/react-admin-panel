import { read, utils } from "xlsx";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, storage } from "../../../firebase";
import { AuthContext } from "../../../context/AuthContextProvider"
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";

// import component
import TableOuter from "../TableOuter";

// import image
import Product from '../../../assets/logo.png'

const Products = () => {
    // context
    const { currentUser } = useContext(AuthContext);

    const nameRef = useRef(null);
    const [keyword, setKeyword] = useState("");
    const [excelData, setExcelData] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const [variations, setVariations] = useState([]);


    // handle file change
    async function handleFileChange(e) {
        e.preventDefault();
        nameRef.current.innerText = e.target.files[0].name;

        // xslx
        const f = await e.target.files[0].arrayBuffer();
        const wb = read(f);

        const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        if(!data.length){
            return toast.error("There is no data in the excel file.");
        }

        // checking of the products has codes
        for (const obj of data) {
            if (!obj.Code) {
                return toast.error("Empty product codes detected. Please, make sure products contain codes.")
            }

            if (!obj.Name) {
                return toast.error("Empty name field detected. Please, make sure product name is not empty.")
            }
        }


        // checking if product codes are duplicate
        const mySet = new Set();
        let hasDuplicateCode = false;

        for (const obj of data) {
            if (mySet.has(obj.Code)) {
                hasDuplicateCode = true;
                break;
            }

            mySet.add(obj.Code)
        }

        if (hasDuplicateCode) {
            toast.error("Duplicate product codes detected. Please, make sure codes are unique.");
            return;
        }

        // checking if variation price field has string value
        const hasStringValues = data.some((row) =>
            Object.entries(row).some(([key, value]) => {
                if (key !== 'Name' && key !== 'Code' && key !== 'Tags') {
                    return typeof value === 'string';
                }
                return false;
            })
        );

        if (hasStringValues) {
            setExcelData([]);
            nameRef.current.innerText = "";
            toast.error('Price field contains string. Please, change it to number.');
            return;
        } else {
            const finalData = data.map(obj => ({
                ...obj,
                Tags: obj.Tags ? obj.Tags.split(",").map(item => item.trim()) : ""
            }));

            setExcelData(finalData);
        }
    }


    // handle file remove
    function handleFileRemove() {
        setExcelData([]);
        nameRef.current.innerText = "";
        const input = document.getElementById("input_field");
        if (input) {
            input.value = "";
        }
    }


    // handle save
    async function handleSave() {
        const toastId = toast.loading("Uploading products...");

        try {
            let items = {};

            excelData.forEach((data) => {
                const matchingProduct = productsData.find(prod => prod.code === data.Code);

                const variations = [];
                Object.keys(data).forEach((key) => {
                    if (key !== 'Name' && key !== 'Code' && key !== 'Tags') {
                        variations.push({ label: key, price: data[key] });
                    }
                });

                items[data.Name] = {
                    name: data.Name,
                    tags: data.Tags,
                    code: data.Code,
                    variations: variations,
                    image: matchingProduct ? (matchingProduct.image === "" ? "" : matchingProduct.image) : ""
                };
            });


            const querySnapshot = await getDocs(collection(db, "products"));

            querySnapshot.docs.forEach((doc) => {
                deleteDoc(doc.ref);
            });

            await setDoc(doc(db, "products", "items"), items);

            fetchProducts();
            toast.success("Data saved successfully!", { id: toastId });
            handleFileRemove();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    }


    const handleImageChange = async (image, code) => {
        if (image && image.size > 1 * 1024 * 1024) {
            return toast.error("Cannot upload image bigger than 1 MB")
        }

        // image compression logic
        const blobURL = URL.createObjectURL(image);
        const img = new Image();
        img.src = blobURL;
        img.onload = function () {

            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, 100, 100);
            canvas.toBlob(async (blob) => {

                // delete previous image
                const storageFolderRef = ref(storage, `ProductImages/${code}`);
                const { items } = await listAll(storageFolderRef)
                const deletionPromises = items.map((item) => deleteObject(ref(storage, item.fullPath)));
                await Promise.all(deletionPromises);

                // upload new image
                const imageRef = ref(storage, `ProductImages/${code}/${image.name}`);
                await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });

                const url = await getDownloadURL(imageRef);

                const querySnapshot = await getDocs(collection(db, "products"));
                const data = querySnapshot.docs.map((doc) => doc.data());

                Object.values(data[0]).forEach((product) => {
                    if (product.code === code) {
                        product.image = url;
                    }
                });

                await setDoc(doc(db, "products", "items"), data[0]);

                fetchProducts();
                toast.success("Image added successfully");
            });
        }
    }

    // fetch products
    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const data = querySnapshot.docs.map((doc) => doc.data());

            if (data.length) {
                const productsArray = Object.keys(data[0]).map((key) => {
                    const product = data[0][key];
                    return {
                        name: product.name,
                        code: product.code,
                        image: product.image,
                        tags: product.tags,
                        variations: product.variations
                    };
                });

                const products = productsArray.filter((prod) =>
                    prod &&
                    prod.name &&
                    (
                        prod.name.toLowerCase().includes(keyword.toLowerCase()) ||
                        (
                            Array.isArray(prod.tags) &&
                            prod.tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(keyword.toLowerCase()))
                        ) ||
                        (typeof prod.tags === 'string' && prod.tags.toLowerCase().includes(keyword.toLowerCase()))
                    )
                )

                    // sorty array alphabetically according.
                    .sort((a, b) => a.name.localeCompare(b.name)); // Sort products alphabetically by product name

                setProductsData(products);

                // update variations.


                let all_variations = [];

                products.forEach((product) => {

                    product.variations.forEach(item => {
                        if (!all_variations.includes(item.label)) {
                            all_variations.push(item.label)
                        }
                    });
                })


                setVariations(all_variations)
            }

        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [keyword]);

    return (
        <div className="flex flex-col">
            <div className="w-[100%] flex mb-[1rem]">
                <div className="mr-auto flex items-center text-[1.25rem] rounded-[0.5rem]">
                    <div className="flex items-center border border-gray-300 p-[0.75rem] sm:w-[18rem] overflow-hidden">
                        <input
                            placeholder="Quick search"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="outline-none text-[1.5rem] pr-[1rem]"
                        />

                        {!keyword && (
                            <i className="fa-solid fa-magnifying-glass cursor-pointer text-[#7d817e] text-[1.5rem] sm:hidden"></i>
                        )}

                        {keyword && (
                            <i onClick={() => setKeyword("")} className="fa-solid fa-xmark cursor-pointer text-[#7d817e] text-[1.5rem] sm:hidden" ></i>
                        )}
                    </div>
                </div>

                {excelData.length === 0 &&
                    <a
                        href="https://firebasestorage.googleapis.com/v0/b/supplier-order-taking-app.appspot.com/o/Products.xlsx?alt=media&token=098b94f3-57aa-455c-bbaf-d820d9b56466"
                        className="text-white bg-blue-500 whitespace-nowrap hover:bg-blue-600 mr-[1rem] flex items-center text-[1.25rem] duration-150 text-[#b2eb5] px-[2rem] py-[1rem] rounded-[0.5rem] shadow-lg">
                        <i className="fa-solid fa-download text-white text-[1.25rem] mr-[1rem]"></i>
                        Download Sample File
                    </a>
                }

                <div className={`${excelData.length == 0 ? "hidden" : "flex"} mr-[1rem] custom-shadow flex justify-between gap-[1rem] items-center text-[1.25rem] duration-150 text-[#b2eb5] rounded-[0.5rem]`} >
                    <p ref={nameRef} className="pl-[1rem]"></p>
                    <i onClick={handleFileRemove} className="fa-solid fa-xmark h-full text-[1rem] border cursor-pointer grid place-items-center px-[1.25rem] bg-gray-200 hover:bg-slate-300 duration-200" ></i>
                </div>

                {excelData.length !== 0 && (
                    <button onClick={handleSave} className="text-white bg-blue-500 hover:bg-blue-600 mr-[1rem] custom-shadow flex items-center text-[1.25rem] duration-150 text-[#b2eb5] px-[2rem] py-[1rem] rounded-[0.5rem]" >
                        Save
                    </button>
                )}

                {excelData.length === 0 && currentUser.role === "admin" && (
                    <label htmlFor="input_field" className="cursor-pointer h-[4rem] flex items-center text-[1.25rem] bg-blue-500 hover:bg-blue-600 duration-150 text-[#fff] px-[2rem] py-[1rem] rounded-[0.5rem] shadow-lg" >
                        <i className="fa-solid fa-upload text-white text-[1.25rem] mr-[1rem]"></i>
                        <p className="text-[1.25rem] whitespace-nowrap">Upload Excel File</p>
                    </label>
                )}

                <input id="input_field" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
            </div>


            <TableOuter thead_data={['S.N.', 'Image', 'Product Name', 'Code', 'Tags', ...variations]} >
                {productsData.map((product, index) => {
                    return (

                        <tr key={product.code} className="border">
                            <td className="px-[1.3rem] py-[0.5rem]">{index + 1}</td>
                            <td className="px-[1.3rem] py-[0.5rem] group">
                                {product.image !== "" && <img src={product.image} alt="product-img" className="h-[5rem] w-[5rem] object-cover group-hover:hidden duration-200" />}
                                {product.image === "" && <img src={Product} alt="product-img" className="h-[5rem] w-[5rem] object-cover group-hover:hidden duration-200" />}

                                <label htmlFor={product.code}>
                                    <i className="fa-solid fa-plus h-[5rem] w-[5rem] border-[#b2beb5] text-[1.5rem] border border-dashed duration-200 hidden cursor-pointer group-hover:flex group-hover:justify-center group-hover:items-center"></i>
                                    <input id={product.code} className="hidden" type="file" accept="image/jpeg" onChange={e => handleImageChange(e.target.files[0], product.code)} />
                                </label>
                            </td>
                            <td className="px-[1.3rem] py-[0.5rem] capitalize">{product.name}</td>
                            <td className="px-[1.3rem] py-[0.5rem]">{(product?.code) ? product.code : ""}</td>
                            <td className="px-[1.3rem] py-[0.5rem] whitespace-nowrap">{(product?.tags) ? product?.tags.join(", ") : ""}</td>
                            {
                                variations.map(variation => (
                                    <td key={variation} className="px-[1.3rem] border py-[0.7rem] empty:after:content-['']">
                                        {product.variations.map(item => (
                                            item.label === variation ? (
                                                item.price
                                            ) : (
                                                ''
                                            )
                                        ))}
                                    </td>
                                ))
                            }
                        </tr>
                    )
                })}
            </TableOuter>

        </div>
    );
};


export default Products;
