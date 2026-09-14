import { Kantumruy_Pro } from "next/font/google";
import localFont from "next/font/local";

export const fontKantumruyPro = Kantumruy_Pro({
  subsets: ["khmer"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kantumruy-pro",
  display: "swap",
});

export const fontJetBrainsMono = localFont({
  src: [
    {
      path: "../../public/ttf/JetBrainsMono-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/ttf/JetBrainsMono-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/ttf/JetBrainsMono-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
