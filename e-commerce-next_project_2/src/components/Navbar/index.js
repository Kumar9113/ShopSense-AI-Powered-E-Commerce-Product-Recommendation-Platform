"use client"
import { Fragment, useContext, useEffect } from "react";

import { adminNavOptions } from "@/utils";
import { navOptions } from "@/utils";
import { GlobalContext } from "@/context";
import CommonModal from "../CommonModal";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import CartModal from "../CartModal";



const user = {
  role: 'admin'
}


function NavItems({ isModalView = false, isAdminView }) {
  const router = useRouter()
  return (
    <div
      className={`items-center justify-between w-full md:flex md:w-auto ${isModalView ? "" : "hidden"
        }`}
      id="nav-items"
    >
      <ul
        className={`flex flex-col p-4 md:p-0 mt-4 font-medium rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0 bg-white ${isModalView ? "border-none" : "border border-brand-light"
          }`}
      >
        {isAdminView
          ? adminNavOptions.map((item) => (
            <li
              className="cursor-pointer block py-2 pl-3 pr-4 text-ink rounded md:p-0 transition-colors hover:text-brand"
              key={item.id}
              onClick={() => router.push(item.path)}
            >
              {item.label}
            </li>
          ))
          : navOptions.map((item) => (
            <li
              className="cursor-pointer block py-2 pl-3 pr-4 text-ink rounded md:p-0 transition-colors hover:text-brand"
              key={item.id}
              onClick={() => router.push(item.path)}
            >
              {item.label}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function Navbar() {
  const { showNavModal, setShowNavModal } = useContext(GlobalContext)
  const { user,
    isAuthUser,
    setIsAuthUser,
    setUser,
    showCartModal,
    setShowCartModal, setCurrentUpdatedProduct, currentUpdatedProduct } = useContext(GlobalContext)


  const router = useRouter();
  const pathName = usePathname()

  useEffect(() => {
    if (
      pathName !== "/admin-view/add-product" &&
      currentUpdatedProduct !== null
    )
      setCurrentUpdatedProduct(null);
  }, [pathName]);




  function handleLogout() {
    setIsAuthUser(false);
    setUser(null);
    Cookies.remove("token");
    localStorage.clear();
    router.push("/");
  }

  const isAdminView = pathName.includes('admin-view')

  return (
    <>
      <nav className="bg-white/95 backdrop-blur fixed w-full z-20 top-0 left-0 border-b border-brand-light">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <div
            onClick={() => router.push("/")}
            className="flex items-center cursor-pointer">
            <span className="self-center text-2xl font-display italic font-medium text-ink whitespace-nowrap">
              Ecommercery
            </span>
          </div>
          <div className="flex md:order-2 gap-2">
            {!isAdminView && isAuthUser ? (
              <Fragment>
                <button
                  className={
                    "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                  }
                  onClick={() => router.push('/account')}

                >
                  Account
                </button>
                <button
                  className={
                    "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                  }
                  onClick={() => setShowCartModal(true)}
                >
                  Cart
                </button>
              </Fragment>
            ) : null}

            {
              user?.role === 'admin' ? (
                isAdminView ? (
                  <button
                    className={
                      "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                    }
                    onClick={() => router.push('/')}

                  >
                    Client View
                  </button>
                ) : (
                  <button

                    className={
                      "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                    }
                    onClick={() => router.push('/admin-view')}

                  >
                    Admin View
                  </button>
                )
              )

                : null
            }
            {isAuthUser ? (
              <button

                className={
                  "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                }
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <button

                className={
                  "mt-1.5 inline-block bg-brand px-5 py-3 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                }
                onClick={() => router.push("/login")}
              >
                Login
              </button>
            )}
            <button
              data-collapse-toggle="navbar-sticky"
              type="button"
              className="inline-flex items-center p-2 text-sm text-ink rounded-lg md:hidden hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light"
              aria-controls="navbar-sticky"
              aria-expanded="false"

              onClick={() => setShowNavModal(true)}

            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <NavItems isAdminView={isAdminView} ></NavItems>
        </div>
      </nav>
      <CommonModal
        showModalTitle={false}
        mainContent={<NavItems isModalView={true} isAdminView={isAdminView}></NavItems>}
        show={showNavModal} setShow={setShowNavModal}></CommonModal>
      {showCartModal && <CartModal />}
    </>
  )
}