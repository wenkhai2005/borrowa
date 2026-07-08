import { useState } from "react";
import { createListing } from "../api";
import { navigate } from "../router";
import { ErrorMessage } from "../components/Status";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

const categories = ["Camera", "Lense", "Action Camera", "Accessories", "Others"];
const brands = ["Sony", "Nikon", "DJI", "GoPro", "Insta", "Others"];
const locations = ["Klang Valley", "Penang", "Melaka", "Johor"];

const modelOptions = {
  Sony: {
    Camera: ["Sony A7 IV", "Sony A7 III", "Sony A7S III", "Sony FX3", "Sony ZV-E10 II"],
    Lense: ["Sony FE 24-70mm f/2.8 GM II", "Sony FE 70-200mm f/2.8 GM OSS II", "Sony FE 50mm f/1.8", "Sony FE 16-35mm f/2.8 GM II"],
    Accessories: ["Sony NP-FZ100 Battery", "Sony XLR Handle Unit"],
    Others: ["Sony ECM-B10 Shotgun Microphone"]
  },
  Nikon: {
    Camera: ["Nikon Z6 III", "Nikon Z8", "Nikon Zf", "Nikon Z50 II"],
    Lense: ["Nikon Z 24-70mm f/2.8 S", "Nikon Z 70-200mm f/2.8 VR S", "Nikon Z 50mm f/1.8 S", "Nikon Z 14-30mm f/4 S"],
    Accessories: ["Nikon EN-EL15c Battery", "Nikon FTZ II Mount Adapter"],
    Others: ["Nikon SB-5000 Speedlight"]
  },
  DJI: {
    "Action Camera": ["DJI Action 4", "DJI Osmo Action 5 Pro", "DJI Pocket 3"],
    Accessories: ["DJI RS 4 Gimbal", "DJI Mic 2", "DJI Osmo Mobile 6"],
    Others: ["DJI Air 3", "DJI Mavic 3 Pro", "DJI Mini 4 Pro", "DJI Avata 2"]
  },
  GoPro: {
    "Action Camera": ["GoPro Hero 13 Black", "GoPro Hero 12 Black", "GoPro Hero 11 Black", "GoPro Max"],
    Accessories: ["GoPro Media Mod", "GoPro Volta Grip", "GoPro Enduro Battery Pack"],
    Others: ["GoPro Creator Edition Kit"]
  },
  Insta: {
    "Action Camera": ["Insta360 X4", "Insta360 Ace Pro", "Insta360 GO 3S", "Insta360 ONE RS"],
    Accessories: ["Insta360 Invisible Selfie Stick", "Insta360 Flow Pro", "Insta360 Bullet Time Kit"],
    Others: ["Insta360 Link 2 Webcam"]
  },
  Others: {
    Camera: ["Fujifilm X-T5", "Fujifilm X-H2S", "Panasonic Lumix S5 II", "Blackmagic Pocket Cinema Camera 6K"],
    Lense: ["Sigma 18-50mm f/2.8 DC DN", "Tamron 28-75mm f/2.8 G2", "Sigma 35mm f/1.4 DG DN", "Tamron 17-70mm f/2.8"],
    "Action Camera": ["DJI Action 4", "Insta360 X4", "Akaso Brave 8"],
    Accessories: ["Tripod Kit", "Memory Card Kit", "Camera Cage", "ND Filter Set"],
    Others: ["Rode Wireless GO II", "Godox SL60W", "Aputure Amaran 100d", "Zhiyun Crane 4"]
  }
};

const initialForm = {
  title: "",
  description: "",
  category: "Camera",
  cameraBrand: "",
  cameraModel: "",
  customModel: "",
  location: "Klang Valley",
  dailyRate: "",
  deposit: "",
  serialNumber: "",
  includedItems: "",
  imageUrl: "",
  isAvailable: true
};

export default function CreateListingPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const availableModels = modelOptions[form.cameraBrand]?.[form.category] || [];
  const usesCustomModel = Boolean(form.cameraBrand) && (form.cameraModel === "Other model" || availableModels.length === 0);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value
      };

      if (name === "cameraBrand" || name === "category") {
        const nextBrand = name === "cameraBrand" ? value : current.cameraBrand;
        const nextCategory = name === "category" ? value : current.category;
        const nextModels = modelOptions[nextBrand]?.[nextCategory] || [];
        next.cameraModel = nextBrand ? nextModels[0] || "Other model" : "";
        next.customModel = "";

        if (!current.title && nextModels[0]) {
          next.title = nextModels[0];
        }
      }

      if ((name === "cameraModel" || name === "customModel") && !current.title) {
        const selectedModel = name === "customModel" ? value : value === "Other model" ? current.customModel : value;
        next.title = selectedModel;
      }

      return next;
    });
  }

  function handleImageFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(new Error("Please upload an image file."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(new Error("Image must be 5MB or smaller."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImagePreview(result);
      setForm((current) => ({ ...current, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const account = getCurrentUser();
      const loggedIn = isLoggedIn();

      if (!account || !loggedIn || account.role !== "SELLER") {
        navigate("/login");
        return;
      }

      const selectedModel = usesCustomModel ? form.customModel : form.cameraModel;
      const { customModel, ...listingPayload } = form;
      const listing = await createListing({
        ...listingPayload,
        cameraModel: selectedModel,
        dailyRate: Number(form.dailyRate),
        deposit: Number(form.deposit),
        imageUrl: form.imageUrl || null
      });
      navigate(`/listings/${listing.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Owner tools</p>
          <h1>Create Listing</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <ErrorMessage error={error} />

        <label>
          Listing title
          <input name="title" onChange={updateField} required value={form.title} />
        </label>

        <label>
          Description
          <textarea name="description" onChange={updateField} required rows="4" value={form.description} />
        </label>

        <div className="form-grid">
          <label>
            Category
            <select name="category" onChange={updateField} required value={form.category}>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Brand
            <select name="cameraBrand" onChange={updateField} required value={form.cameraBrand}>
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Model
            <select disabled={!form.cameraBrand} name="cameraModel" onChange={updateField} required value={form.cameraModel}>
              {!form.cameraBrand ? <option value="">Select brand first</option> : null}
              {availableModels.map((model) => (
                <option key={model}>{model}</option>
              ))}
              <option>Other model</option>
            </select>
          </label>

          {usesCustomModel ? (
            <label>
              Custom model
              <input name="customModel" onChange={updateField} required value={form.customModel} />
            </label>
          ) : (
            <label>
              Matched product
              <input readOnly value={form.cameraModel || "Select a model"} />
            </label>
          )}
        </div>

        <div className="form-grid">
          <label>
            Location
            <select name="location" onChange={updateField} required value={form.location}>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </label>

          <label>
            Daily rate
            <input min="1" name="dailyRate" onChange={updateField} required step="0.01" type="number" value={form.dailyRate} />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Deposit
            <input min="0" name="deposit" onChange={updateField} required step="0.01" type="number" value={form.deposit} />
          </label>

          <label>
            Serial number
            <input name="serialNumber" onChange={updateField} required value={form.serialNumber} />
          </label>
        </div>

        <label>
          Included items
          <textarea
            name="includedItems"
            onChange={updateField}
            placeholder="Example: Camera body, 2 batteries, charger, 64GB SD card, camera bag"
            required
            rows="3"
            value={form.includedItems}
          />
        </label>

        <label>
          Upload image
          <input accept="image/*" onChange={handleImageFile} type="file" />
        </label>

        {imagePreview ? (
          <div className="image-preview">
            <img alt="Listing preview" src={imagePreview} />
          </div>
        ) : null}

        <label className="checkbox-row">
          <input checked={form.isAvailable} name="isAvailable" onChange={updateField} type="checkbox" />
          Available for booking
        </label>

        <div className="button-row">
          <button className="secondary-button" onClick={() => navigate("/")} type="button">
            Cancel
          </button>
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </form>
    </section>
  );
}
