import { useState } from "react";

// import components
import OrderDetailDrawer from "./OrderDetailDrawer";

const OrderRow = ({ order, getOrders, index }) => {
    const [openOrderDetailDrawer, setOpenOrderDetailDrawer] = useState(false);

    return (
        <>
            {
                order && order.order_count > 0 && (
                    <tr className="border">
                        <td className='p-[1.5rem]'>{index+1}</td>
                        <td className='p-[1.5rem]'>{order?.store_name}</td>
                        <td className='p-[1.5rem]'>{order?.phone_number ? order.phone_number : "-"}</td>
                        <td className='p-[1.5rem]'>{order?.contact_person ? order.contact_person : "-"}</td>
                        <td className='p-[1.5rem]'>{order?.address ? order.address : "-"}</td>
                        <td className='p-[1.5rem]'>{order?.order_count}</td>
                        <td className='p-[1.5rem]'>
                            <button onClick={() => setOpenOrderDetailDrawer(true)} className="py-[0.5rem] px-[1rem] text-[1.25rem] whitespace-nowrap cursor-pointer rounded-[0.5rem] bg-slate-100" >View Details</button>
                            <OrderDetailDrawer 
                                order={order} 
                                openOrderDetailDrawer={openOrderDetailDrawer} 
                                setOpenOrderDetailDrawer={setOpenOrderDetailDrawer} 
                                getOrders={getOrders} 
                            />
                        </td>
                    </tr>
                )
            }
        </>
    )
}

export default OrderRow