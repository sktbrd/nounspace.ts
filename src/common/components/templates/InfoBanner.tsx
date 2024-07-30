import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaTimes } from "react-icons/fa";

export default function InfoBanner() {
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { pathname, query } = router;
  const userFarcasterName = query.handle;

  useEffect(() => {
    let storedState: string | null;

    if (pathname === "/homebase") {
      storedState = localStorage.getItem("homebaseBannerDisplayed");
      if (!storedState) {
        setIsDisplayed(true);
        setMessage(
          "Your homebase is a space that only you can see. Click the paintbrush to customize it 🚀",
        );
      } else {
        setIsDisplayed(false);
      }
    } else if (
      pathname.startsWith("/s/") &&
      userFarcasterName === "farcaster"
    ) {
      storedState = localStorage.getItem("profileBannerDisplayed");
      if (!storedState) {
        setIsDisplayed(true);
        setMessage(
          "This is your profile. Click the paintbrush to customize your space.",
        );
      } else {
        setIsDisplayed(false);
      }
    } else {
      setIsDisplayed(false);
    }
  }, [pathname, userFarcasterName]);

  const closeBanner = () => {
    setIsDisplayed(false);
    if (pathname === "/homebase") {
      localStorage.setItem("homebaseBannerDisplayed", "false");
    } else if (pathname.startsWith("/s/")) {
      localStorage.setItem("profileBannerDisplayed", "false");
    }
  };

  if (!isDisplayed) return null;

  return (
    <div className="flex justify-center p-4 bg-blue-100 border border-blue-300 rounded-md m-1">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <img
            src="https://i.ibb.co/L8Fb37T/image.png"
            alt="rocket"
            className="w-8 h-8 object-contain"
          />
        </div>
        <p className="text-blue-600 ml-2">{message}</p>
        <button onClick={closeBanner} className="bg-transparent">
          <FaTimes className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}
