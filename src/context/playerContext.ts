import { createContext } from "react";

export type PlayerContextType = {
  nickname: string;
  setNickname: React.Dispatch<React.SetStateAction<string>>;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined,
);
