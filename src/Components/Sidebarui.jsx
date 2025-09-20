import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiBarChart,
  FiArrowLeftCircle,
  FiChevronDown,
  FiChevronsRight,
  FiDollarSign,
  FiHome,
  FiMonitor,
  FiShoppingCart,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Dashpage from "../Pages/Sidebarpages/Dashpage";
import Salepage from "../Pages/Sidebarpages/Salepage";
import Viewpage from "../Pages/Sidebarpages/Viewpage";

export const Example = () => {
  const [selected, setSelected] = useState("Dashboard");

  return (
    <div className="flex bg-indigo-50">
      <Sidebar selected={selected} setSelected={setSelected} />
      <ExampleContent selected={selected} />
    </div>
  );
};

const Sidebar = ({ selected, setSelected }) => {  
  const [open, setOpen] = useState(true);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <motion.nav
      layout
      className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white p-2"
      style={{
        width: open ? "225px" : "fit-content",
      }}
    >
      <TitleSection open={open} user="rhys pogi"/>

      <div className="space-y-1">
        <Option Icon={FiHome} title="Dashboard" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiDollarSign} title="Sales" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiMonitor} title="View Site" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiShoppingCart} title="Products" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiTag} title="Tags" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiBarChart} title="Analytics" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={FiArrowLeftCircle} title="Logout" selected={selected} setSelected={setSelected} onClick={handleLogout} open={open} />
      </div>

      <ToggleClose open={open} setOpen={setOpen} />

    </motion.nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, onClick  }) => {
  return (
    <motion.button
      layout
      onClick={() => {
        if (onClick) {
          onClick();   // ✅ run custom handler (like handleLogout)
        } else {
          setSelected(title); // ✅ fallback for normal menu items
        }
      }}
      className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
        selected === title
          ? "bg-indigo-100 text-indigo-800"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <motion.div
        layout
        className="grid h-full w-10 place-content-center text-lg"
      >
        <Icon />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="text-xs font-medium"
        >
          {title}
        </motion.span>
      )}

      {notifs && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          style={{ y: "-50%" }}
          transition={{ delay: 0.5 }}
          className="absolute right-2 top-1/2 size-4 rounded bg-indigo-500 text-xs text-white"
        >
          {notifs}
        </motion.span>
      )}
    </motion.button>
  );
};

const TitleSection = ({open,user}) => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <div className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2">
          <motion.div
            layout
            className="grid h-full w-10 place-content-center text-lg"
          >
            <FiUsers />
          </motion.div>
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
            >
              <span className="text-md font-semibold">{user}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const Logo = () => {
  // Temp logo from https://logoipsum.com/
  return (
    <motion.div
      layout
      className="grid size-10 shrink-0 place-content-center rounded-md bg-indigo-600"
    >
      <svg
        width="24"
        height="auto"
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-slate-50"
      >
        <path
          d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
          stopColor="#000000"
        ></path>
        <path
          d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
          stopColor="#000000"
        ></path>
      </svg>
    </motion.div>
  );
};

const ToggleClose = ({ open, setOpen }) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-2">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform ${open && "rotate-180"}`}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium"
          >
            Hide
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

const ExampleContent = ({ selected }) => {
  return (
    <div className="h-[200vh] w-full p-4">
      {selected === "Dashboard" && <Dashpage/>}
      {selected === "Sales" && <Salepage/>}
      {selected === "View Site" && <Viewpage/>}
      {selected === "Products" && <h1 className="text-xl font-bold">Products Page</h1>}
      {selected === "Tags" && <h1 className="text-xl font-bold">Tags Page</h1>}
      {selected === "Analytics" && <h1 className="text-xl font-bold">Analytics Page</h1>}
    </div>
  );
};