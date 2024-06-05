import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import { TicketSearch } from "../schemas/TicketSearch";
import TicketModel from "../models/TicketModel";
import { Ticket } from "../interfaces/Ticket";
import { TicketCreate } from "../schemas/TicketCreate";
import TicketModal from "../models/TicketModel";
import NotFound from "../errors/NotFound";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const {
      userId,
      userEmail,
      title,
      description,
      categoryId,
      statusId,
      priorityId,
      page,
    }: TicketSearch = query;

    let [tickets, count] = await TicketModel.search(
      {
        userId,
        userEmail,
        title,
        description,
        categoryId,
        statusId,
        priorityId,
      },
      page,
    );

    if (count === -1) count = await TicketModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        tickets.map((x: Ticket) => {
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

export const getAllByStatus: RequestHandler = async (req, res, next) => {
  try {
    let response = await TicketModal.getAllByStatus();

    res.status(200).send(new Result(true, '', response));
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const ticketData = req.body as TicketCreate;

    const ticket: Ticket = {
      id: 0,
      userId: ticketData.userId,
      staffId: ticketData.staffId,
      staffName: ticketData.staffName,
      userEmail: ticketData.userEmail,
      title: ticketData.title,
      description: ticketData.description,
      categoryId: ticketData.categoryId,
      priorityId: ticketData.priorityId,
      statusId: ticketData.statusId,
    };

    const result = await TicketModel.create(ticket);

    return res.status(200).send(
      new Result(true, "Ticket created", {
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

    const ticket = await TicketModel.getById(~~+id);

    if (!ticket)
      return next(new NotFound("No ticket status with this ID"));

    const newTicket = await TicketModel.updateById(
      ~~+id,
      req.body as Ticket,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Ticket updated successfully", newTicket),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteTicket: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const ticket = await TicketModel.getById(~~+id);

    if (!ticket) return next(new NotFound("No ticket with this ID"));

    await TicketModel.deleteById(ticket.id);

    return res.status(200).send(new Result(true, `Ticket with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};
