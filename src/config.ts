import { homedir } from 'node:os';
import { join } from 'node:path';

/** Asana's official V2 MCP server. Remote HTTP + OAuth (no dynamic client registration). */
export const MCP_URL = 'https://mcp.asana.com/v2/mcp';
/** RFC 8707 resource indicator Asana's docs point authorization at. */
export const RESOURCE_URL = 'https://mcp.asana.com/v2';

export const CONFIG_DIR = join(homedir(), '.config', 'asana-axi');
export const CREDENTIALS_PATH = join(CONFIG_DIR, 'credentials.json');

/** Real tool names from developers.asana.com/docs/mcp-tools-reference. */
export const TOOLS = {
  searchObjects: 'search_objects',
  getTask: 'get_task',
  getTasks: 'get_tasks',
  getMyTasks: 'get_my_tasks',
  searchTasks: 'search_tasks',
  getProject: 'get_project',
  getProjects: 'get_projects',
  getPortfolio: 'get_portfolio',
  getPortfolios: 'get_portfolios',
  getItemsForPortfolio: 'get_items_for_portfolio',
  getStatusOverview: 'get_status_overview',
  getAttachments: 'get_attachments',
  getUser: 'get_user',
  getMe: 'get_me',
  getUsers: 'get_users',
  getTeams: 'get_teams',
  getAgent: 'get_agent',
  getWorkspaceAgents: 'get_workspace_agents',
  createTasks: 'create_tasks',
  createProject: 'create_project',
  updateTasks: 'update_tasks',
  deleteTask: 'delete_task',
  addComment: 'add_comment',
  createProjectStatusUpdate: 'create_project_status_update',
} as const;
