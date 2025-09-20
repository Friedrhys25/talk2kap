import React from "react";
import { FiMail } from "react-icons/fi";

const HoverDevCards = () => {
  return (
    <div className="p-4">

      <p className="text-xl font-semibold mb-2">Dashboard</p>

      <div className="grid gap-6 grid-cols-6 lg:grid-cols-5 md:grid-cols-2 sm:grid-cols-1">
        <Card title="Purok 1" Icon={FiMail}/>
        <Card title="Purok 2" Icon={FiMail}/>
        <Card title="Purok 3" Icon={FiMail}/>
        <Card title="Purok 4" Icon={FiMail}/>
        <Card title="Purok 5" Icon={FiMail}/>
        <Card title="Purok 6" Icon={FiMail}/>
      </div>

    </div>
  );
};

const Card = ({ title, Icon, href }) => {
  return (
    <a
      href={href}
      className="w-50 p-4 rounded border-[1px] border-slate-300 relative overflow-hidden group bg-white"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

      <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-100 group-hover:text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
      <Icon className="mb-2 text-2xl text-violet-600 group-hover:text-white transition-colors relative z-10 duration-300" />
      <h3 className="font-medium text-lg text-slate-950 group-hover:text-white relative z-10 duration-300">
        {title}
      </h3>
    </a>
  );
};

export default HoverDevCards;