import React from 'react';
import moment from 'moment/moment'
import { toast } from "react-hot-toast";
import { db } from "../../../firebase"
import { doc, deleteDoc, collection, getDocs } from "firebase/firestore"

// import component
import TableOuter from '../TableOuter';

const OrderDetailDrawer = ({ openOrderDetailDrawer, setOpenOrderDetailDrawer, getOrders, order }) => {

    let totalPrice = 0;

    const deleteSubcollection = async (collectionRef) => {
        const querySnapshot = await getDocs(collectionRef);

        // Delete documents in the subcollection
        await Promise.all(querySnapshot.docs.map(async (doc) => {
            const subcollectionRef = collection(doc.ref, 'subcollection'); // Replace 'subcollection' with your actual subcollection name
            await deleteSubcollection(subcollectionRef); // Recursively delete subcollections
            await deleteDoc(doc.ref); // Delete the document
        }));
    };

    const markOrderAsDispatched = async () => {
        const confirmDispatch = window.confirm("Are you sure you want to dispatch the order? This action cannot be undone.");
        if (confirmDispatch) {
            try {
                const documentRef = doc(db, 'all_orders', order.store_id);
                await deleteSubcollection(collection(documentRef, 'orders'));
                await deleteDoc(documentRef);
                getOrders();
                setOpenOrderDetailDrawer(false);
                toast.success("Current order is removed from the database.");
            } catch (error) {
                toast.error('Error deleting document:', error);
            }
        }
    };


    return (
        <>
            <div
                onClick={(e) => {
                    if (e.target.id === "overlay") {
                        setOpenOrderDetailDrawer(false)
                    }
                }}
                id="overlay"
                className={`${openOrderDetailDrawer ? "visible" : "hidden"} absolute top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 transition-all ease-out duration-200`}
            >
            </div>

            <div className={` ${openOrderDetailDrawer ? 'top-[0]' : 'top-[100%]'} overflow-y-auto w-[100%] p-[2rem] absolute top-0 left-0 h-full transition-all ease-in-out duration-300 z-[50] bg-white `} >
                <div className='flex  items-center mb-[1rem]'>
                    <div className='text-[1.8rem] flex-1 flex flex-col'>
                        <div className='text-[1.75rem] font-semibold text-left'>Orders of {order.store_name}</div>
                        <div className='flex gap-[1rem]'>
                            <div className='text-[1.25rem] text-gray-500'><span className='text-[1.35rem] text-black'>Phone: </span>{order?.phone_number}</div>
                            <div className='text-[1.25rem] text-gray-500'><span className='text-[1.35rem] text-black'>PAN: </span>{order.store_id}</div>
                            <div className='text-[1.25rem] text-gray-500'><span className='text-[1.35rem] text-black'>Address: </span>{order.address}</div>
                        </div>
                    </div>

                    <button onClick={() => markOrderAsDispatched()} className="h-[3.5rem] mr-4 text-[1.25rem] bg-green-600 text-white px-[1.2rem]  rounded-[0.5rem]">
                        <i className="fa-solid fa-check mr-[1rem]"></i>
                        Mark as Dispatched
                    </button>

                    <button onClick={() => setOpenOrderDetailDrawer(false)} className="h-[3.5rem] px-[1.2rem] text-[1.25rem] bg-gray-600 text-white  rounded-[0.5rem]">
                        <i className="fa-solid fa-xmark mr-[1rem]"></i>
                        Close
                    </button>
                </div>

                <TableOuter thead_data={['Item', '', 'Qty', 'Rate', 'Total']}>

                    {order?.orders[0] && order?.orders.map((odr, index) => {
                        totalPrice += odr.total;
                        return(
                            <React.Fragment key={index}>
                                <tr>
                                    <td colSpan={4} className="py-[1rem] px-[1.5rem]  text-[1.35rem] font-bold text-left">
                                        {moment(odr.date).format('MMMM DD, YYYY h:mm A')}</td>
                                </tr>

                                {odr.orderItems[0] && odr.orderItems.map((item, index) => {

                                    return (
                                        <tr key={index} className="border border-collapse">
                                            <td className="py-[1rem] px-[1.5rem] text-[1.35rem] w-[50px] ">{index + 1}</td>
                                            <td className="py-[1rem] px-[1.5rem] text-[1.35rem]">{item.itemName}</td>
                                            <td className="py-[1rem] px-[1.5rem] text-[1.35rem]">{item.quantity + ' ' + item.unitType}</td>
                                            <td className="py-[1rem] px-[1.5rem] text-[1.35rem]">Rs. {item.price}</td>
                                            <td className="py-[1rem] px-[1.5rem] text-[1.35rem]">Rs. {item.price * item.quantity}</td>
                                        </tr>
                                    );
                                })}

                            </React.Fragment>

                        )

                    })}
                    
                    <tr>
                        <td colSpan={4} className="py-[1rem] px-[1.5rem]  text-[1.35rem] font-bold">Grand Total</td>
                        <td className="py-[1rem] px-[1.5rem] text-[1.35rem] font-bold">Rs. {totalPrice.toFixed(2)}</td>
                    </tr>

                </TableOuter>

            </div >
        </>
    )
}

export default OrderDetailDrawer