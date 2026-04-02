import React, { useMemo, useState } from "react";
import { PlayerContext } from "./playerContext";

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem("nickname") || "";
  });

  const [userId, setUserId] = useState<string>(() => {
    const savedUserId = localStorage.getItem("userId");

    if (savedUserId) return savedUserId;

    const newUserId = crypto.randomUUID();
    localStorage.setItem("userId", newUserId);
    return newUserId;
  });

  const value = useMemo(
    () => ({
      nickname,
      setNickname,
      userId,
      setUserId,
    }),
    [nickname, userId],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
