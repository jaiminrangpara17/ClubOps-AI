import { useOutletContext } from "react-router-dom";
import type { ClubEvent } from "@/types";

/** Reads the event supplied by `EventLayout` to its child routes. */
export function useCurrentEvent(): ClubEvent {
  return useOutletContext<ClubEvent>();
}
