import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Category = "Caballos" | "Ganado" | "Accesorios";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type CustomerData = {
  fullName: string;
  idType: string;
  idNumber: string;
  phone: string;
  country: string;
  department: string;
  city: string;
  address: string;
};

const PRODUCTS_STORAGE_KEY = "pasion-llanera-products";
const ADMIN_AUTH_KEY = "pasion-llanera-admin-auth";
const WHATSAPP_NUMBER = "573102087357";

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "cab-1",
    name: "Silla de montar en cuero premium",
    description: "Silla resistente y comoda para jornadas largas de cabalgata.",
    price: 1250000,
    image:
      "https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Caballos",
  },
  {
    id: "cab-2",
    name: "Cabezal trenzado artesanal",
    description: "Fabricado en cuero natural con herrajes anticorrosivos.",
    price: 185000,
    image:
      "https://images.pexels.com/photos/16522117/pexels-photo-16522117/free-photo-of-horse-riding-equestrian-horseback-riding.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Caballos",
  },
  {
    id: "gan-1",
    name: "Pretal reforzado para ganado",
    description: "Dise�o reforzado para manejo seguro de reses en finca.",
    price: 145000,
    image:
      "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Ganado",
  },
  {
    id: "gan-2",
    name: "Lazo llanero de alto rendimiento",
    description: "Lazo flexible y durable para faena diaria de campo.",
    price: 82000,
    image:
      "https://images.pexels.com/photos/212324/pexels-photo-212324.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Ganado",
  },
  {
    id: "acc-1",
    name: "Cinturon vaquero en cuero",
    description: "Accesorio clasico para trabajo y uso casual con estilo llanero.",
    price: 98000,
    image:
      "https://images.pexels.com/photos/45055/pexels-photo-45055.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Accesorios",
  },
  {
    id: "acc-2",
    name: "Porta herramientas de montura",
    description: "Organizador de cuero para llevar implementos esenciales.",
    price: 76000,
    image:
      "https://images.pexels.com/photos/5800226/pexels-photo-5800226.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Accesorios",
  },
];

const EMPTY_CUSTOMER: CustomerData = {
  fullName: "",
  idType: "",
  idNumber: "",
  phone: "",
  country: "",
  department: "",
  city: "",
  address: "",
};

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "Caballos" as Category,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const categories: Array<Category | "Todos"> = ["Todos", "Caballos", "Ganado", "Accesorios"];

const inputClass =
  "w-full border border-amber-900/20 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-amber-700";

function loadProducts(): Product[] {
  const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!storedProducts) {
    return DEFAULT_PRODUCTS;
  }

  try {
    const parsed = JSON.parse(storedProducts) as Product[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

function getProductId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "Todos">("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>(EMPTY_CUSTOMER);
  const [showValidation, setShowValidation] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    localStorage.getItem(ADMIN_AUTH_KEY) === "true"
  );
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const isAdminRoute = hash === "#admin";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
      const text = `${product.name} ${product.description}`.toLowerCase();
      const searchMatch = text.includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, searchTerm]);

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) return null;
        return {
          ...product,
          quantity: item.quantity,
          subtotal: item.quantity * product.price,
        };
      })
      .filter((item): item is Product & { quantity: number; subtotal: number } => Boolean(item));
  }, [cart, products]);

  const total = useMemo(
    () => cartDetails.reduce((acc, item) => acc + item.subtotal, 0),
    [cartDetails]
  );

  const customerIsValid = Object.values(customerData).every((value) => value.trim().length > 0);

  const addToCart = (productId: string) => {
    setCart((current) => {
      const found = current.find((item) => item.productId === productId);
      if (found) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const handleFinalizeByWhatsApp = () => {
    setShowValidation(true);
    if (cartDetails.length === 0 || !customerIsValid) return;

    const orderLines = cartDetails
      .map((item) => `${item.name} x ${item.quantity} - ${formatCurrency(item.subtotal)}`)
      .join("\n");

    const message = [
      "Hola, quiero realizar un pedido:",
      "",
      "Datos del cliente:",
      `Nombre: ${customerData.fullName}`,
      `Tipo de ID: ${customerData.idType}`,
      `Numero de ID: ${customerData.idNumber}`,
      `Telefono: ${customerData.phone}`,
      `Pais: ${customerData.country}`,
      `Departamento: ${customerData.department}`,
      `Ciudad: ${customerData.city}`,
      `Direccion: ${customerData.address}`,
      "",
      "Pedido:",
      "",
      orderLines,
      "",
      `Total a pagar: ${formatCurrency(total)}`,
    ].join("\n");

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const handleAdminLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adminUser === "admin" && adminPass === "PasionLlanera2026") {
      setIsAdminAuthenticated(true);
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      setAdminError("");
      return;
    }
    setAdminError("Credenciales invalidas.");
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setHash("");
    window.location.hash = "";
  };

  const handleSubmitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number(productForm.price);
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.image.trim()) return;
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;

    if (editingProductId) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                name: productForm.name,
                description: productForm.description,
                image: productForm.image,
                category: productForm.category,
                price: parsedPrice,
              }
            : product
        )
      );
      setEditingProductId(null);
    } else {
      setProducts((current) => [
        {
          id: getProductId(),
          name: productForm.name,
          description: productForm.description,
          image: productForm.image,
          category: productForm.category,
          price: parsedPrice,
        },
        ...current,
      ]);
    }

    setProductForm(EMPTY_PRODUCT_FORM);
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      price: String(product.price),
    });
  };

  const deleteProduct = (productId: string) => {
    setProducts((current) => current.filter((product) => product.id !== productId));
    setCart((current) => current.filter((item) => item.productId !== productId));
    if (editingProductId === productId) {
      setEditingProductId(null);
      setProductForm(EMPTY_PRODUCT_FORM);
    }
  };

  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <main className="min-h-screen bg-[#f3efe7] px-4 py-12">
          <section className="mx-auto max-w-md border border-amber-900/20 bg-white p-8">
            <h1 className="font-serif text-3xl text-zinc-900">Pasion Llanera</h1>
            <p className="mt-2 text-sm text-zinc-600">Acceso privado de administracion</p>
            <form className="mt-8 space-y-4" onSubmit={handleAdminLogin}>
              <input
                className={inputClass}
                placeholder="Usuario"
                value={adminUser}
                onChange={(event) => setAdminUser(event.target.value)}
                required
              />
              <input
                className={inputClass}
                type="password"
                placeholder="Contrasena"
                value={adminPass}
                onChange={(event) => setAdminPass(event.target.value)}
                required
              />
              {adminError ? <p className="text-sm text-red-700">{adminError}</p> : null}
              <button
                className="w-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
                type="submit"
              >
                Ingresar
              </button>
            </form>
          </section>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-[#f3efe7] px-4 py-10">
        <section className="mx-auto max-w-6xl space-y-8">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-amber-900/20 pb-4">
            <div>
              <h1 className="font-serif text-4xl text-zinc-900">Panel Administrador</h1>
              <p className="text-sm text-zinc-600">Gestion de productos de Pasion Llanera</p>
            </div>
            <button
              className="border border-zinc-700 px-4 py-2 text-sm text-zinc-800 transition hover:bg-zinc-900 hover:text-white"
              onClick={handleAdminLogout}
            >
              Cerrar sesion
            </button>
          </header>

          <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <form className="space-y-3 border border-amber-900/20 bg-white p-5" onSubmit={handleSubmitProduct}>
              <h2 className="font-semibold text-zinc-900">
                {editingProductId ? "Editar producto" : "Nuevo producto"}
              </h2>
              <input
                className={inputClass}
                placeholder="Nombre"
                value={productForm.name}
                onChange={(event) => setProductForm((p) => ({ ...p, name: event.target.value }))}
                required
              />
              <textarea
                className={`${inputClass} min-h-24 resize-none`}
                placeholder="Descripcion"
                value={productForm.description}
                onChange={(event) => setProductForm((p) => ({ ...p, description: event.target.value }))}
                required
              />
              <input
                className={inputClass}
                placeholder="URL de imagen"
                value={productForm.image}
                onChange={(event) => setProductForm((p) => ({ ...p, image: event.target.value }))}
                required
              />
              <input
                className={inputClass}
                type="number"
                min={1}
                placeholder="Precio"
                value={productForm.price}
                onChange={(event) => setProductForm((p) => ({ ...p, price: event.target.value }))}
                required
              />
              <select
                className={inputClass}
                value={productForm.category}
                onChange={(event) =>
                  setProductForm((p) => ({ ...p, category: event.target.value as Category }))
                }
              >
                <option value="Caballos">Caballos</option>
                <option value="Ganado">Ganado</option>
                <option value="Accesorios">Accesorios</option>
              </select>
              <div className="flex gap-3">
                <button
                  className="bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
                  type="submit"
                >
                  {editingProductId ? "Guardar cambios" : "Crear producto"}
                </button>
                {editingProductId ? (
                  <button
                    className="border border-zinc-400 px-4 py-2 text-sm text-zinc-700"
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(EMPTY_PRODUCT_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>

            <div className="overflow-x-auto border border-amber-900/20 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50 text-zinc-700">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-zinc-200">
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="border border-zinc-400 px-3 py-1 text-xs text-zinc-700"
                            onClick={() => startEditingProduct(product)}
                          >
                            Editar
                          </button>
                          <button
                            className="border border-red-700 px-3 py-1 text-xs text-red-700"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f6f0e3] text-zinc-900">
      <section className="hero-pan relative min-h-[100svh] overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Llanero montando a caballo en el campo"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/30" />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-6 py-14 text-white"
        >
          <p className="text-base tracking-[0.25em] text-amber-100">PASION LLANERA</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Talabarteria profesional para el trabajo real de campo
          </h1>
          <p className="mt-5 max-w-2xl text-base text-amber-50 sm:text-lg">
            Equipo resistente para caballos, ganado y accesorios vaqueros con la calidad que exige
            la faena llanera.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#tienda"
              className="bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
            >
              Ver catalogo
            </a>
            <a
              href="#checkout"
              className="border border-amber-100/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Comprar ahora
            </a>
          </div>
        </motion.div>
      </section>

      <section id="tienda" className="mx-auto w-full max-w-6xl px-6 py-14">
        <header className="space-y-2 border-b border-amber-900/20 pb-5">
          <h2 className="font-serif text-3xl text-zinc-900">Catalogo de productos</h2>
          <p className="text-zinc-600">Busca por categoria o nombre y agrega al carrito en segundos.</p>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            className="min-w-64 flex-1 border border-amber-900/25 bg-white px-4 py-2 text-sm outline-none transition focus:border-amber-700"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 text-sm transition ${
                selectedCategory === category
                  ? "bg-amber-900 text-white"
                  : "border border-amber-900/30 bg-white text-zinc-700 hover:bg-amber-100"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="border border-amber-900/20 bg-white"
            >
              <img className="h-52 w-full object-cover" src={product.image} alt={product.name} />
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">{product.category}</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">{product.name}</h3>
                </div>
                <p className="text-sm text-zinc-600">{product.description}</p>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="font-semibold text-amber-900">{formatCurrency(product.price)}</p>
                  <button
                    className="bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                    onClick={() => addToCart(product.id)}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="checkout" className="bg-[#efe5d2]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="font-serif text-3xl text-zinc-900">Datos del cliente</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Este formulario es obligatorio para finalizar la compra por WhatsApp.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Nombre completo"
                value={customerData.fullName}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, fullName: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Tipo de identificacion"
                value={customerData.idType}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, idType: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Numero de identificacion"
                value={customerData.idNumber}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, idNumber: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Numero de telefono"
                value={customerData.phone}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, phone: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Pais"
                value={customerData.country}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, country: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Departamento"
                value={customerData.department}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, department: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Ciudad"
                value={customerData.city}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, city: event.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Direccion completa"
                value={customerData.address}
                onChange={(event) =>
                  setCustomerData((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
            {showValidation && !customerIsValid ? (
              <p className="mt-3 text-sm text-red-700">Completa todos los campos obligatorios.</p>
            ) : null}

            <div className="mt-10 border border-amber-900/20 bg-white p-5">
              <h3 className="text-lg font-semibold text-zinc-900">Metodos de pago manuales</h3>
              <p className="mt-3 text-sm text-zinc-700">Nequi: 3102087357</p>
              <p className="text-sm text-zinc-700">Daviplata: 3102087357</p>
              <p className="text-sm text-zinc-700">Llave: 3102087357</p>
              <p className="mt-4 text-sm font-medium text-amber-900">
                Realiza el pago y envia el comprobante por WhatsApp junto con tu pedido.
              </p>
            </div>
          </div>

          <aside className="border border-amber-900/20 bg-white p-5 lg:sticky lg:top-6 lg:h-fit">
            <h2 className="font-serif text-2xl text-zinc-900">Carrito de compras</h2>
            <AnimatePresence mode="popLayout">
              {cartDetails.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-sm text-zinc-600"
                >
                  Aun no tienes productos en el carrito.
                </motion.p>
              ) : (
                <motion.ul key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
                  {cartDetails.map((item) => (
                    <motion.li
                      layout
                      key={item.id}
                      className="border-b border-zinc-200 pb-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">{formatCurrency(item.price)} por unidad</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="h-7 w-7 border border-zinc-300 text-zinc-700"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-sm">{item.quantity}</span>
                          <button
                            className="h-7 w-7 border border-zinc-300 text-zinc-700"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="text-xs text-red-700 underline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-6 border-t border-zinc-200 pt-4">
              <p className="flex items-center justify-between text-sm">
                <span>Total:</span>
                <span className="text-lg font-semibold text-amber-900">{formatCurrency(total)}</span>
              </p>
              {showValidation && cartDetails.length === 0 ? (
                <p className="mt-2 text-sm text-red-700">Agrega al menos un producto al carrito.</p>
              ) : null}
            </div>

            <button
              className="mt-6 w-full bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
              onClick={handleFinalizeByWhatsApp}
            >
              Finalizar compra por WhatsApp
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
