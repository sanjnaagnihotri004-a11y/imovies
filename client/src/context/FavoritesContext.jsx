
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]); // ids of favorite movies
  const [loaded, setLoaded] = useState(false);

  // Load the list when someone logs in, clear it when they log out
  useEffect(() => {
    if (!user) {
      setIds([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    api
      .get("/favorite")
      .then((res) => setIds(res.data.movies.map((m) => m._id)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user]);

  // Add or remove one movie. The heart changes instantly.
  const toggle = async (movieId) => {
    const before = ids;
    const isFav = ids.includes(movieId);
    setIds(isFav ? ids.filter((i) => i !== movieId) : [...ids, movieId]);
    try {
      if (isFav) await api.delete(`/favorite/${movieId}`);
      else await api.post(`/favorite/${movieId}`);
    } catch (err) {
      setIds(before); // undo if the server said no
      throw err;
    }
  };

  return (
    <FavoritesContext.Provider value={{ ids, loaded, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);