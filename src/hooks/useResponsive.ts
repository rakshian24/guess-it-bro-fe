import { useMediaQuery } from "@mui/material";
import { screenSize } from "../constants";

const useResponsive = () => {
  const isTablet = useMediaQuery(`(max-width:${screenSize.tablet})`);
  const isPcAndAbove = useMediaQuery(`(min-width:${screenSize.pc})`);
  const isMobile = useMediaQuery(`(max-width:${screenSize.mobile})`);
  return {
    isMobile,
    isTablet,
    isPcAndAbove,
  };
};

export default useResponsive;
