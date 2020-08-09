import knex from "../database/connection";
import { Request, Response } from "express";

class PointsController {
  async show(req: Request, res: Response) {
    const { id } = req.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return res.status(400).json({ message: "Point not found" });
    }

    const serialiazedPoint = {
      ...point,
      image_url: `http://192.168.1.34:3333/uploads/${point.image}`,
    };

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.title");

    return res.json({ point: serialiazedPoint, items });
  }

  async index(req: Request, res: Response) {
    const { uf, city, items } = req.query;

    const parsedItem = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItem)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    const serialiazedPoints = points.map((point) => ({
      ...point,
      image_url: `http://192.168.1.34:3333/uploads/${point.image}`,
    }));

    return res.json(serialiazedPoints);
  }

  async create(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        items,
      } = req.body;

      //utiliza transação, os inserts só irão ocorrer se o todos obtiverem sucesso
      const trx = await knex.transaction();

      const point = {
        image: req.file.filename,
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
      };

      const insertedIds = await trx("points").insert(point);

      const point_id = insertedIds[0];

      const pointsItems = items
        .split(",")
        .map((item: string) => Number(item.trim()))
        .map((item_id: number) => {
          return {
            item_id,
            point_id,
          };
        });

      await trx("point_items").insert(pointsItems);

      await trx.commit();

      return res.json({
        id: point_id,
        ...point,
      });
    } catch (e) {
      console.log(e);
    }
  }
}

export default PointsController;
