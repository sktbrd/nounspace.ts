import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaInfoCircle, FaTimes } from "react-icons/fa";

export default function InfoBanner({ userFarcasterName }) {
  const [isDisplayed, setIsDisplayed] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { pathname, query } = router;
  const slug = query.slug;

  useEffect(() => {
    // Check localStorage for banner display state
    const storedState = localStorage.getItem("bannerDisplayed");
    if (storedState === "false") {
      setIsDisplayed(false);
    }

    // Set message based on the route and userFarcasterName
    if (pathname === "/homebase") {
      setMessage(
        "Your homebase is a space that only you can see. Click the paintbrush to customize it 🚀",
      );
    } else if (pathname === `/s/${slug}` && slug === userFarcasterName) {
      setMessage(
        "This is your profile. Click the paintbrush to customize your space.",
      );
    } else {
      setIsDisplayed(false);
    }
  }, [pathname, slug, userFarcasterName]);

  const closeBanner = () => {
    setIsDisplayed(false);
    localStorage.setItem("bannerDisplayed", "false"); // Update localStorage
  };

  if (!isDisplayed) return null;

  return (
    <div className="flex justify-center p-4 bg-blue-100 border border-blue-300 rounded-md m-1">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <FaInfoCircle className="text-blue-600 mr-2" />
          <span className="text-blue-600 font-medium">Important Note!</span>
        </div>
        <p className="text-blue-600 ml-2">{message}</p>
        <button onClick={closeBanner} className="bg-transparent">
          <FaTimes className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}
