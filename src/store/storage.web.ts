// Lazy wrapper so localStorage is only accessed at call time, not module load time
const webStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

export default webStorage;
