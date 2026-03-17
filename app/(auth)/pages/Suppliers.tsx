import React, { Children } from 'react';
import { TopBar } from '../components/TopBar';
import {
  PlusIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  StarIcon } from
'lucide-react';
import { motion } from 'framer-motion';
const SUPPLIERS = [
{
  id: 1,
  name: 'TechCorp Electronics',
  contact: 'Alice Johnson',
  email: 'alice@techcorp.com',
  phone: '+1 (555) 123-4567',
  rating: 4.8,
  status: 'Active',
  type: 'Electronics'
},
{
  id: 2,
  name: 'EcoFabrics Ltd',
  contact: 'Marcus Chen',
  email: 'marcus@ecofabrics.co',
  phone: '+1 (555) 987-6543',
  rating: 4.5,
  status: 'Active',
  type: 'Apparel'
},
{
  id: 3,
  name: 'KitchenWonders Inc',
  contact: 'Sarah Miller',
  email: 'sarah@kitchenwonders.com',
  phone: '+1 (555) 456-7890',
  rating: 4.9,
  status: 'Active',
  type: 'Home & Kitchen'
},
{
  id: 4,
  name: 'Global Accessories',
  contact: 'David Smith',
  email: 'david@globalacc.net',
  phone: '+1 (555) 234-5678',
  rating: 3.8,
  status: 'Under Review',
  type: 'Accessories'
},
{
  id: 5,
  name: 'Prime Footwear',
  contact: 'Elena Rodriguez',
  email: 'elena@primefootwear.com',
  phone: '+1 (555) 876-5432',
  rating: 4.7,
  status: 'Active',
  type: 'Footwear'
},
{
  id: 6,
  name: 'NextGen Cables',
  contact: 'Tom Wilson',
  email: 'tom@nextgencables.com',
  phone: '+1 (555) 345-6789',
  rating: 4.2,
  status: 'Inactive',
  type: 'Electronics'
}];

const containerVariants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};
export function Suppliers() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Suppliers
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your vendor relationships and contacts
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" aria-hidden="true" />
            Add Supplier
          </button>
        </div>

        {/* Supplier Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show">
          
          {SUPPLIERS.map((supplier) =>
          <motion.div
            key={supplier.id}
            variants={itemVariants}
            className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow">
            
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-lg font-bold text-stone-400">
                    {supplier.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      {supplier.name}
                    </h3>
                    <p className="text-sm text-stone-500">{supplier.type}</p>
                  </div>
                </div>
                <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${supplier.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : supplier.status === 'Inactive' ? 'bg-stone-100 text-stone-800 border-stone-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                
                  {supplier.status}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <GlobeIcon className="w-4 h-4 text-stone-400" />
                  <span>{supplier.contact}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <MailIcon className="w-4 h-4 text-stone-400" />
                  <a
                  href={`mailto:${supplier.email}`}
                  className="hover:text-amber-600 transition-colors">
                  
                    {supplier.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <PhoneIcon className="w-4 h-4 text-stone-400" />
                  <span>{supplier.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-stone-900">
                    {supplier.rating}
                  </span>
                  <span className="text-xs text-stone-500 ml-1">/ 5.0</span>
                </div>
                <button className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                  View Details
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>);

}