import { Loader2 } from "lucide-react";
import styles from "../dashboard.module.css";

export default function Loading() {
  return (
    <div className={`${styles.workspace} flex items-center justify-center h-full bg-white`}>
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}
