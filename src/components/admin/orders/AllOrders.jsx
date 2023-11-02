import { useState } from "react";
import { useEffect } from "react";
import { db } from "../../../firebase"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

// import commpoent
import TableOuter from "../TableOuter";

// import components
import OrderRow from "./OrderRow";

const AllOrders = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [keyword, setKeyword] = useState("");

    const getOrders = async () => {

        const allOrdersQuerySnapshot = await getDocs(collection(db, 'all_orders'));

        const allOrdersData = await Promise.all(allOrdersQuerySnapshot.docs.map(async (doc) => {
            const allOrdersDocData = doc.data();
            const ordersQuerySnapshot = await getDocs(query(collection(doc.ref, 'orders'), orderBy('date', 'desc')));
            const ordersData = ordersQuerySnapshot.docs.map((orderDoc) => {
                const orderData = orderDoc.data();
                const orderID = orderDoc.id; // Retrieve the document ID
                return { id: orderID, ...orderData };
            });
            return { store_id: doc.id, ...allOrdersDocData, orders: ordersData };
        }));

        setAllOrders(allOrdersData.filter((odr) => odr.store_name.toLowerCase().includes(keyword.toLowerCase()) && parseInt(odr.order_count) > 0));
        return allOrdersData;
    };

    // useEffect
    useEffect(() => {
        getOrders();
    }, [keyword]);

    return (
        <div className="flex flex-col">
            <div className="mr-auto relative flex items-center text-[1.25rem] rounded-[0.5rem] mb-[1rem]">
                <input
                    placeholder="Quick search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-[4rem] border border-gray-300 p-[0.75rem] text-[1.5rem] pr-[5rem]"
                />

                {!keyword && (
                    <i className="fa-solid fa-magnifying-glass absolute cursor-pointer text-[#7d817e] text-[1.5rem] bottom-[0.5rem] right-[1rem] transform translate-y-[-50%]"></i>
                )}

                {keyword && (
                    <i
                        onClick={() => setKeyword("")}
                        className="fa-solid fa-xmark absolute cursor-pointer text-[#7d817e] text-[1.5rem] bottom-[0.5rem] right-[1rem] transform translate-y-[-50%]"
                    ></i>
                )}
            </div>

            <TableOuter thead_data={['S.N.', 'Store Name', 'Contact Number', 'Contact Person', 'Address', 'Orders Count', 'Detail']}>
                {
                    allOrders[0] && allOrders.map((order, index) => (
                        <OrderRow order={order} key={index} index={index} getOrders={getOrders} />
                    ))
                }
            </TableOuter>
        </div>
    )
}

export default AllOrders