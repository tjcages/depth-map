"use client";

import { useEffect, useState } from "react";
import { proxy, snapshot, subscribe, useSnapshot } from "valtio";

interface State {
  // General States
  ready: boolean;
}

const defaultState: State = {
  // General States
  ready: false
};

// Define which keys should not be persisted
const nonPersistentKeys: (keyof State)[] = ["ready"];

const state = proxy<State>(defaultState);

const readonly = <T>(value: T): Readonly<T> => {
  return value as Readonly<T>;
};

function loadState(): Partial<State> {
  if (typeof window === "undefined") return {};

  try {
    const savedState = localStorage.getItem("persistentState");
    if (!savedState) return {};

    const parsedState = JSON.parse(savedState) as Partial<State>;
    return Object.fromEntries(
      Object.entries(parsedState).filter(([key]) => !nonPersistentKeys.includes(key as keyof State))
    ) as Partial<State>;
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
    return {};
  }
}

function saveState(stateToSave: State): void {
  if (typeof window === "undefined") return;

  try {
    const persistentState = Object.fromEntries(
      Object.entries(stateToSave).filter(([key]) => !nonPersistentKeys.includes(key as keyof State))
    );
    localStorage.setItem("persistentState", JSON.stringify(persistentState));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

// Custom hook for using state with automatic loading
function useLocalState(): State {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedState = loadState();
    Object.assign(state, loadedState);
    setIsLoaded(true);

    const unsubscribe = subscribe(state, () => {
      const currentState = snapshot(state);
      saveState(currentState as State);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const snapshotState = useSnapshot(state);

  // Return the default state while loading to ensure type consistency
  return isLoaded ? readonly(Object.assign(snapshotState) as State) : readonly(defaultState);
}

export { state, useLocalState };
export type { State };
