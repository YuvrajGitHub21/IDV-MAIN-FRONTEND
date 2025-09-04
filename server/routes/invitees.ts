import { RequestHandler } from "express";
import { Invitee, InviteesResponse } from "@shared/api";

// Static data for now; later to be replaced by DB fetch
const SAMPLE_INVITEES: Invitee[] = [
  {
    id: "1",
    name: "Roger G. Rhone",
    email: "RogerGRhone@teleworm.us",
    initials: "OP",
    avatarColor: "#F4DEE4",
    department: "Operations",
    selected: true,
  },
  {
    id: "2",
    name: "Mike J. Torres",
    email: "MikeJTorres@rhyta.com",
    initials: "MT",
    avatarColor: "#D6ECF5",
    department: "IT & Security",
    selected: false,
  },
  {
    id: "3",
    name: "Wanda C. Moore",
    email: "WandaCMoore@dayrep.com",
    initials: "WM",
    avatarColor: "#E0DAEE",
    department: "Marketing",
    selected: false,
  },
  {
    id: "4",
    name: "Roy C. Kephart",
    email: "RoyCKephart@dayrep.com",
    initials: "RK",
    avatarColor: "#FFE6DE",
    department: "Sales",
    selected: true,
  },
  {
    id: "5",
    name: "Lois S. Spencer",
    email: "LoisSSpencer@rhyta.com",
    initials: "LS",
    avatarColor: "#DAE5E6",
    department: "Finance",
    selected: false,
  },
  {
    id: "6",
    name: "Jerry T. Beavers",
    email: "JerryTBeavers@teleworm.us",
    initials: "JB",
    avatarColor: "#F4EBE8",
    department: "Human Resources",
    selected: false,
  },
];

export const handleGetInvitees: RequestHandler = (_req, res) => {
  const response: InviteesResponse = { employees: SAMPLE_INVITEES };
  res.json(response);
};
