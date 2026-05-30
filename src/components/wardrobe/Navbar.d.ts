/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "@/components/wardrobe/Navbar" {
  import { FC } from "react";
  interface NavbarProps {
    page?: string;
    goPage?: (page: string) => void;
    bag?: any[];
    wishlist?: any[];
    setPanel?: (panel: string | null) => void;
    activePage?: string;
  }
  const Navbar: FC<NavbarProps>;
  export default Navbar;
}
