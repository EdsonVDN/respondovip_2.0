import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import LoyaltyRoundedIcon from "@material-ui/icons/LoyaltyRounded";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import TableChartIcon from "@material-ui/icons/TableChart";
import api from "../services/api";
import BorderColorIcon from "@material-ui/icons/BorderColor";
import ToDoList from "../pages/ToDoList/";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import {
  AllInclusive,
  AttachFile,
  BlurCircular,
  Description,
  DeviceHubOutlined,
  Schedule,
} from "@material-ui/icons";
import usePlans from "../hooks/usePlans";
import Typography from "@material-ui/core/Typography";
import useVersion from "../hooks/useVersion";
import { MailOutline as MailOutlineIcon } from "@material-ui/icons";
import { Send as SendIcon } from "@material-ui/icons";
import { Schedule as ScheduleIcon } from "@material-ui/icons";
import { PlaylistAddCheck as PlaylistAddCheckIcon } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#ff0000",
    color: "#ffffff",
    "& .MuiListItemIcon-root": {
      minWidth: "40px",
      color: "#ffffff", // para deixar o ícone branco também
    },
    "& .MuiListItemText-root": {
      textAlign: "center",
      marginRight: "40px", // compensa o espaço do ícone para centralizar o texto
    },
    "&:hover": {
      backgroundColor: "#cc0000",
      opacity: 0.9,
    },
  },
}));

function ListItemLink(props) {
  const { icon, primary, to, className } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button dense component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const history = useHistory();
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  const [openEmailSubmenu, setOpenEmailSubmenu] = useState(false);

  const [version, setVersion] = useState(false);

  const { getVersion } = useVersion();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);

      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowKanban(planConfigs.plan.useKanban);
      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowInternalChat(planConfigs.plan.useInternalChat);
      setShowExternalApi(planConfigs.plan.useExternalApi);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <ListItemLink
            to="/"
            primary="Dashboard"
            icon={
              <img
                src={`${process.env.PUBLIC_URL}/icones/dashboard.png`}
                alt="Tags"
                style={{ width: "26px", height: "26px" }}
              />
            }
          />
        )}
      />

      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/tickets.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />
      {/* <ListItem
        button
        onClick={() => setOpenEmailSubmenu((prev) => !prev)}
        className={classes.listItem}
      >
        <ListItemIcon>
          <MailOutlineIcon />
        </ListItemIcon>
        <ListItemText primary={i18n.t("Email")} />
        {openEmailSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={openEmailSubmenu} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemLink
            to="/Email"
            primary={i18n.t("Enviar")}
            icon={<SendIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailLis"
            primary={i18n.t("Enviados")}
            icon={<EventIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailScheduler"
            primary={i18n.t("Agendar")}
            icon={<ScheduleIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailsAgendado"
            primary={i18n.t("Agendados")}
            icon={<ScheduleIcon />}
            className={classes.nested}
          />
        </List>
      </Collapse> */}
      {showKanban && (
        <ListItemLink
          to="/kanban"
          primary={i18n.t("Kanban")}
          icon={
            <img
              src={`${process.env.PUBLIC_URL}/icones/backlog.png`}
              alt="Tags"
              style={{ width: "26px", height: "26px" }}
            />
          }
        />
      )}

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/respostarapida.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <ListItemLink
        to="/todolist"
        primary={i18n.t("Tarefas")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/tarefas.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/contatos.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <ListItemLink
        to="/schedules"
        primary={i18n.t("mainDrawer.listItems.schedules")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/schedules.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/rotulo.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <ListItemLink
        to="/chats"
        primary={i18n.t("mainDrawer.listItems.chats")}
        icon={
          <Badge color="secondary" variant="dot" invisible={invisible}>
            <img
              src={`${process.env.PUBLIC_URL}/icones/chatinterno.png`}
              alt="Tags"
              style={{ width: "26px", height: "26px" }}
            />
          </Badge>
        }
      />

      <ListItemLink
        to="/helps"
        primary={i18n.t("mainDrawer.listItems.helps")}
        icon={
          <img
            src={`${process.env.PUBLIC_URL}/icones/ajuda.png`}
            alt="Tags"
            style={{ width: "26px", height: "26px" }}
          />
        }
      />

      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider />
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20,
              }}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader>

            {showCampaigns && (
              <>
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                >
                  <ListItemLink
                    small
                    // to="/campaigns"
                    primary={i18n.t("Campanhas")}
                    icon={
                      <img
                        src={`${process.env.PUBLIC_URL}/icones/campanhas.png`}
                        alt="Tags"
                        style={{ width: "24px", height: "24px" }}
                      />
                    }
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItemLink
                      small
                      to="/campaigns"
                      primary={i18n.t("Listagem")}
                      icon={
                        <img
                          src={`${process.env.PUBLIC_URL}/icones/listagem.png`}
                          alt="Tags"
                          style={{ width: "24px", height: "24px" }}
                        />
                      }
                    />

                    {/* <ListItemText primary="Listagem" /> */}

                    <ListItemLink
                      small
                      to="/contact-lists"
                      primary={i18n.t("Listas de Contatos")}
                      icon={
                        <img
                          src={`${process.env.PUBLIC_URL}/icones/listadecontatos.png`}
                          alt="Tags"
                          style={{ width: "24px", height: "24px" }}
                        />
                      }
                    />

                    {/* <ListItemText primary="Listas de Contatos" /> */}

                    <ListItemLink
                      small
                      to="/campaigns-config"
                      primary={i18n.t("Configurações")}
                      icon={
                        <img
                          src={`${process.env.PUBLIC_URL}/icones/settings.png`}
                          alt="Tags"
                          style={{ width: "24px", height: "24px" }}
                        />
                      }
                    />
                    {/* <ListItemText primary="Configurações" /> */}
                  </List>
                </Collapse>
              </>
            )}
            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={
                  <img
                    src={`${process.env.PUBLIC_URL}/icones/announcements.png`}
                    alt="Tags"
                    style={{ width: "26px", height: "26px" }}
                  />
                }
              />
            )}
            {/* {user.super && (
              <ListItemLink
                to="/campanhaAvancada"
                primary={i18n.t("Campanha Avancada")}
                icon={<PlaylistAddCheckIcon />}
                className={classes.listItem}
              />
            )} */}
            {showOpenAi && (
              <ListItemLink
                to="/prompts"
                primary={i18n.t("mainDrawer.listItems.prompts")}
                icon={
                  <img
                    src={`${process.env.PUBLIC_URL}/icones/prompts.png`}
                    alt="Tags"
                    style={{ width: "26px", height: "26px" }}
                  />
                }
              />
            )}

            {showIntegrations && (
              <ListItemLink
                to="/queue-integration"
                primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                icon={
                  <img
                    src={`${process.env.PUBLIC_URL}/icones/integracoes.png`}
                    alt="Tags"
                    style={{ width: "26px", height: "26px" }}
                  />
                }
              />
            )}
            {/* <ListItemLink
              to="/typebot"
              primary={i18n.t("Typebot")}
              icon={<AccountTreeOutlinedIcon />}
            /> */}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge color="secondary" variant="dot" invisible={invisible}>
                  {
                    <img
                      src={`${process.env.PUBLIC_URL}/icones/conexao.png`}
                      alt="Tags"
                      style={{ width: "26px", height: "26px" }}
                    />
                  }
                </Badge>
              }
            />
            <ListItemLink
              to="/files"
              primary={i18n.t("mainDrawer.listItems.files")}
              icon={
                <img
                  src={`${process.env.PUBLIC_URL}/icones/files.png`}
                  alt="Tags"
                  style={{ width: "26px", height: "26px" }}
                />
              }
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={
                <img
                  src={`${process.env.PUBLIC_URL}/icones/chatbot.png`}
                  alt="Tags"
                  style={{ width: "26px", height: "26px" }}
                />
              }
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={
                <img
                  src={`${process.env.PUBLIC_URL}/icones/users.png`}
                  alt="Tags"
                  style={{ width: "26px", height: "26px" }}
                />
              }
            />
            {showExternalApi && (
              <>
                <ListItemLink
                  to="/messages-api"
                  primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                  icon={
                    <img
                      src={`${process.env.PUBLIC_URL}/icones/messages-api.png`}
                      alt="Tags"
                      style={{ width: "26px", height: "26px" }}
                    />
                  }
                />
              </>
            )}
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={
                <img
                  src={`${process.env.PUBLIC_URL}/icones/financeiro2.png`}
                  alt="Tags"
                  style={{ width: "26px", height: "26px" }}
                />
              }
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={
                <img
                  src={`${process.env.PUBLIC_URL}/icones/settings.png`}
                  alt="Tags"
                  style={{ width: "26px", height: "26px" }}
                />
              }
            />

            {!collapsed && (
              <React.Fragment>
                <Divider />
                {/* 
              // IMAGEM NO MENU
              <Hidden only={['sm', 'xs']}>
                <img style={{ width: "100%", padding: "10px" }} src={logo} alt="image" />            
              </Hidden> 
              */}
                <Typography
                  style={{
                    fontSize: "12px",
                    padding: "10px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  V: {`${version}`}
                </Typography>
              </React.Fragment>
            )}
          </>
        )}
      />
      <Divider />
      <li>
        <ListItem
          button
          dense
          onClick={handleClickLogout}
          className={classes.logoutButton}
        >
          <ListItemIcon>
            <RotateRight />
          </ListItemIcon>
          <ListItemText primary={i18n.t("Sair")} />
        </ListItem>
      </li>
    </div>
  );
};

export default MainListItems;
