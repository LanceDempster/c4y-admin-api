import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import { TicketCategorySearch} from "../schemas/TicketCategorySearch";
import NotFound from "../errors/NotFound";
import { TicketCategory } from "../interfaces/TicketCategory";
import TicketCategoryModel from "../models/TicketCategoryModel";
import { TicketCategoryUpdate } from "../schemas/TicketCategoryUpdate";
import { TicketCategoryCreate } from "../schemas/TicketCategoryCreate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { name, description, page }: TicketCategorySearch = query;

    let [ticketCategories, count] = await TicketCategoryModel.search(
      { name, description },
      page,
    );

    if (count === -1) count = await TicketCategoryModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        ticketCategories.map((x: TicketCategory) => {
          return {
            ...x,
          };
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const ticketCategoryData = req.body as TicketCategoryCreate;

    const ticketCategory: TicketCategory = {
      id: 0,
      name: ticketCategoryData.name,
      description: ticketCategoryData.description,
    };

    const result = await TicketCategoryModel.create(ticketCategory);

    return res.status(200).send(
      new Result(true, "Ticket Category created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticketCategory = await TicketCategoryModel.getById(~~+id);

    if (!ticketCategory)
      return next(new NotFound("No ticket category with this ID"));

    const newTicketCategory = await TicketCategoryModel.updateById(
      ~~+id,
      req.body as TicketCategoryUpdate,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Ticket category updated successfully", newTicketCategory),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteTicketCategory: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const ticketCategory = await TicketCategoryModel.getById(~~+id);

    if (!ticketCategory) return next(new NotFound("No ticket category with this ID"));

    await TicketCategoryModel.deleteById(ticketCategory.id);

    return res.status(200).send(new Result(true, `Ticket Category with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};
