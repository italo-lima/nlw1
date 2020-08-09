import React, {
  useEffect,
  useCallback,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import { Map, TileLayer, Marker } from "react-leaflet";
import axios from "axios";
import { LeafletMouseEvent } from "leaflet";

import api from "../../services/api";
import logo from "../../assets/logo.svg";
import DropZone from "../../components/DropZone";

import "./styles.css";

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  const [selectedUF, setSelectdUF] = useState("0");
  const [selectedCity, setSelectdCity] = useState("0");
  const [selectedPosition, setSelectdPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [selectedFile, setSelectedFile] = useState<File>();

  const history = useHistory();

  const loadItems = useCallback(async () => {
    const { data } = await api.get("items");

    setItems(data);
  }, []);

  const loadStates = useCallback(async () => {
    const { data } = await axios.get<IBGEUFResponse[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados`
    );

    const ufInitials = data.map((uf) => uf.sigla);
    setUfs(ufInitials);
  }, []);

  const loadCity = useCallback(async () => {
    const { data } = await axios.get<IBGECityResponse[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
    );

    const cityNames = data.map((city) => city.nome);
    setCities(cityNames);
  }, [selectedUF]);

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;

    setSelectdUF(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;

    setSelectdCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectdPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleChangeInput(event: ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  function handleSelectedItem(id: number) {
    const alreadyItem = selectedItems.findIndex((item) => item === id);

    if (alreadyItem >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const [latitude, longitude] = selectedPosition;
    const uf = selectedUF;
    const city = selectedCity;
    const items = selectedItems;

    const data = new FormData();

    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsapp);
    data.append("city", city);
    data.append("uf", uf);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(","));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    await api.post("points", data);

    alert("Ponto de coleta criado com sucesso!!!");
    history.push("/");
  }

  useEffect(() => {
    loadItems();
    loadStates();
  }, [loadItems, loadStates]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
      setSelectdPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    if (selectedUF === "0") {
      return;
    }

    loadCity();
  }, [selectedUF, loadCity]);

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br /> ponto de coleta
        </h1>

        <DropZone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name"> Nome da entidade </label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleChangeInput}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email"> Email </label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleChangeInput}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp"> Whatsapp </label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleChangeInput}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço do mapa</span>
          </legend>

          {initialPosition[0] !== 0 && initialPosition[1] !== 0 && (
            <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={selectedPosition} />
            </Map>
          )}

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF) </label>
              <select
                name="uf"
                id="uf"
                value={selectedUF}
                onChange={handleSelectUF}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais ítens abaixo </span>
          </legend>

          <ul className="items-grid">
            {items.length &&
              items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelectedItem(item.id)}
                  className={selectedItems.includes(item.id) ? "selected" : ""}
                >
                  <img src={item.image_url} alt={item.title} />
                  <span> {item.title} </span>
                </li>
              ))}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
