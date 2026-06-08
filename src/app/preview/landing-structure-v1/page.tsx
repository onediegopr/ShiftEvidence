import type { Metadata } from "next";
import LandingStructureLabPage from "../../../components/preview/LandingStructureLabPage";

export const metadata: Metadata = {
  title: "LAB PREVIEW - Landing Structure v1",
  description:
    "Internal lab preview for a reorganized Shift Evidence landing structure. Not the live homepage.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LandingStructureLabPage />;
}
