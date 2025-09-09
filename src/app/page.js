import BannedCard from "@/components/BannedCard";
import Maintenance from "@/components/Maintenance";

export default function Page() {
  const mode = process.env.NEXT_PUBLIC_MODE || "maintenance"; // "banned" | "maintenance"
  return mode === "banned" ? <BannedCard /> : <Maintenance />;
}
