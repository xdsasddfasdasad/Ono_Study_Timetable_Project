import { useEffect } from "react";
import { hashPassword } from "../../utils/hash";

export default function GenerateHashes() {
  useEffect(() => {
    const generate = async () => {
      const adminHash = await hashPassword("admin123");
      const studentHash = await hashPassword("student123");

      console.log("✅ Admin hash:", adminHash);
      console.log("✅ Student hash:", studentHash);
    };

    generate();
  }, []);

  return <div style={{ padding: "2rem" }}>Check the console for generated hashes.</div>;
}
