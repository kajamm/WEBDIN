"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push(getToken() ? "/mahasiswa" : "/login");
  }, [router]);

  return null;
}
