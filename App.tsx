import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import Page_0 from "./pages/audit.tsx";
import PageLayout_0 from "./pages/audit.pageLayout.tsx";
import Page_1 from "./pages/login.tsx";
import PageLayout_1 from "./pages/login.pageLayout.tsx";
import Page_2 from "./pages/users.tsx";
import PageLayout_2 from "./pages/users.pageLayout.tsx";
import Page_3 from "./pages/_index.tsx";
import PageLayout_3 from "./pages/_index.pageLayout.tsx";
import Page_4 from "./pages/public.tsx";
import PageLayout_4 from "./pages/public.pageLayout.tsx";
import Page_5 from "./pages/internal.tsx";
import PageLayout_5 from "./pages/internal.pageLayout.tsx";
import Page_6 from "./pages/policies.tsx";
import PageLayout_6 from "./pages/policies.pageLayout.tsx";
import Page_7 from "./pages/settings.tsx";
import PageLayout_7 from "./pages/settings.pageLayout.tsx";
import Page_8 from "./pages/dashboard.tsx";
import PageLayout_8 from "./pages/dashboard.pageLayout.tsx";
import Page_9 from "./pages/users.create.tsx";
import PageLayout_9 from "./pages/users.create.pageLayout.tsx";
import Page_10 from "./pages/notifications.tsx";
import PageLayout_10 from "./pages/notifications.pageLayout.tsx";
import Page_11 from "./pages/organizations.tsx";
import PageLayout_11 from "./pages/organizations.pageLayout.tsx";
import Page_12 from "./pages/login.$orgSlug.tsx";
import PageLayout_12 from "./pages/login.$orgSlug.pageLayout.tsx";
import Page_13 from "./pages/policies.create.tsx";
import PageLayout_13 from "./pages/policies.create.pageLayout.tsx";
import Page_14 from "./pages/acknowledgements.tsx";
import PageLayout_14 from "./pages/acknowledgements.pageLayout.tsx";
import Page_15 from "./pages/policy-templates.tsx";
import PageLayout_15 from "./pages/policy-templates.pageLayout.tsx";
import Page_16 from "./pages/settings.portals.tsx";
import PageLayout_16 from "./pages/settings.portals.pageLayout.tsx";
import Page_17 from "./pages/for-organizations.tsx";
import PageLayout_17 from "./pages/for-organizations.pageLayout.tsx";
import Page_18 from "./pages/$orgId.$portalSlug.tsx";
import PageLayout_18 from "./pages/$orgId.$portalSlug.pageLayout.tsx";
import Page_19 from "./pages/$orgId.admin.audit.tsx";
import PageLayout_19 from "./pages/$orgId.admin.audit.pageLayout.tsx";
import Page_20 from "./pages/$orgId.admin.users.tsx";
import PageLayout_20 from "./pages/$orgId.admin.users.pageLayout.tsx";
import Page_21 from "./pages/policies.$policyId.tsx";
import PageLayout_21 from "./pages/policies.$policyId.pageLayout.tsx";
import Page_22 from "./pages/portal.$portalSlug.tsx";
import PageLayout_22 from "./pages/portal.$portalSlug.pageLayout.tsx";
import Page_23 from "./pages/$orgId.admin.policies.tsx";
import PageLayout_23 from "./pages/$orgId.admin.policies.pageLayout.tsx";
import Page_24 from "./pages/$orgId.admin.settings.tsx";
import PageLayout_24 from "./pages/$orgId.admin.settings.pageLayout.tsx";
import Page_25 from "./pages/register-organization.tsx";
import PageLayout_25 from "./pages/register-organization.pageLayout.tsx";
import Page_26 from "./pages/$orgId.admin.dashboard.tsx";
import PageLayout_26 from "./pages/$orgId.admin.dashboard.pageLayout.tsx";
import Page_27 from "./pages/policies.$policyId.edit.tsx";
import PageLayout_27 from "./pages/policies.$policyId.edit.pageLayout.tsx";
import Page_28 from "./pages/$orgId.admin.users.create.tsx";
import PageLayout_28 from "./pages/$orgId.admin.users.create.pageLayout.tsx";
import Page_29 from "./pages/$orgId.admin.notifications.tsx";
import PageLayout_29 from "./pages/$orgId.admin.notifications.pageLayout.tsx";
import Page_30 from "./pages/$orgId.$portalSlug.$policyId.tsx";
import PageLayout_30 from "./pages/$orgId.$portalSlug.$policyId.pageLayout.tsx";
import Page_31 from "./pages/$orgId.admin.policies.create.tsx";
import PageLayout_31 from "./pages/$orgId.admin.policies.create.pageLayout.tsx";
import Page_32 from "./pages/$orgId.admin.acknowledgements.tsx";
import PageLayout_32 from "./pages/$orgId.admin.acknowledgements.pageLayout.tsx";
import Page_33 from "./pages/$orgId.admin.policy-templates.tsx";
import PageLayout_33 from "./pages/$orgId.admin.policy-templates.pageLayout.tsx";
import Page_34 from "./pages/$orgId.admin.settings.portals.tsx";
import PageLayout_34 from "./pages/$orgId.admin.settings.portals.pageLayout.tsx";
import Page_35 from "./pages/policies.$policyId.acknowledge.tsx";
import PageLayout_35 from "./pages/policies.$policyId.acknowledge.pageLayout.tsx";
import Page_36 from "./pages/$orgId.admin.policies.$policyId.tsx";
import PageLayout_36 from "./pages/$orgId.admin.policies.$policyId.pageLayout.tsx";
import Page_37 from "./pages/$orgId.admin.policies.$policyId.edit.tsx";
import PageLayout_37 from "./pages/$orgId.admin.policies.$policyId.edit.pageLayout.tsx";
import Page_38 from "./pages/portal.$portalSlug.policies.$policyId.tsx";
import PageLayout_38 from "./pages/portal.$portalSlug.policies.$policyId.pageLayout.tsx";
import Page_39 from "./pages/$orgId.admin.handbook.tsx";
import PageLayout_39 from "./pages/$orgId.admin.handbook.pageLayout.tsx";
import Page_40 from "./pages/$orgId.admin.faq.tsx";
import PageLayout_40 from "./pages/$orgId.admin.faq.pageLayout.tsx";
import Page_41 from "./pages/$orgId.admin.assistant.tsx";
import PageLayout_41 from "./pages/$orgId.admin.assistant.pageLayout.tsx";
import Page_42 from "./pages/forgot-password.tsx";
import PageLayout_42 from "./pages/forgot-password.pageLayout.tsx";
import Page_43 from "./pages/reset-password.tsx";
import PageLayout_43 from "./pages/reset-password.pageLayout.tsx";
import Page_44 from "./pages/superadmin.login.tsx";
import PageLayout_44 from "./pages/superadmin.login.pageLayout.tsx";
import Page_45 from "./pages/superadmin.organizations.tsx";
import PageLayout_45 from "./pages/superadmin.organizations.pageLayout.tsx";

if (!window.requestIdleCallback) {
  window.requestIdleCallback = (cb) => {
    setTimeout(cb, 1);
  };
}

import "./base.css";

const fileNameToRoute = new Map([["./pages/audit.tsx","/audit"],["./pages/login.tsx","/login"],["./pages/users.tsx","/users"],["./pages/_index.tsx","/"],["./pages/public.tsx","/public"],["./pages/internal.tsx","/internal"],["./pages/policies.tsx","/policies"],["./pages/settings.tsx","/settings"],["./pages/dashboard.tsx","/dashboard"],["./pages/users.create.tsx","/users/create"],["./pages/notifications.tsx","/notifications"],["./pages/organizations.tsx","/organizations"],["./pages/login.$orgSlug.tsx","/login/:orgSlug"],["./pages/policies.create.tsx","/policies/create"],["./pages/acknowledgements.tsx","/acknowledgements"],["./pages/policy-templates.tsx","/policy-templates"],["./pages/settings.portals.tsx","/settings/portals"],["./pages/for-organizations.tsx","/for-organizations"],["./pages/$orgId.$portalSlug.tsx","/:orgId/:portalSlug"],["./pages/$orgId.admin.audit.tsx","/:orgId/admin/audit"],["./pages/$orgId.admin.users.tsx","/:orgId/admin/users"],["./pages/policies.$policyId.tsx","/policies/:policyId"],["./pages/portal.$portalSlug.tsx","/portal/:portalSlug"],["./pages/$orgId.admin.policies.tsx","/:orgId/admin/policies"],["./pages/$orgId.admin.settings.tsx","/:orgId/admin/settings"],["./pages/register-organization.tsx","/register-organization"],["./pages/$orgId.admin.dashboard.tsx","/:orgId/admin/dashboard"],["./pages/$orgId.admin.handbook.tsx","/:orgId/admin/handbook"],["./pages/$orgId.admin.faq.tsx","/:orgId/admin/faq"],["./pages/$orgId.admin.assistant.tsx","/:orgId/admin/assistant"],["./pages/forgot-password.tsx","/forgot-password"],["./pages/reset-password.tsx","/reset-password"],["./pages/policies.$policyId.edit.tsx","/policies/:policyId/edit"],["./pages/$orgId.admin.users.create.tsx","/:orgId/admin/users/create"],["./pages/$orgId.admin.notifications.tsx","/:orgId/admin/notifications"],["./pages/$orgId.$portalSlug.$policyId.tsx","/:orgId/:portalSlug/:policyId"],["./pages/$orgId.admin.policies.create.tsx","/:orgId/admin/policies/create"],["./pages/$orgId.admin.acknowledgements.tsx","/:orgId/admin/acknowledgements"],["./pages/$orgId.admin.policy-templates.tsx","/:orgId/admin/policy-templates"],["./pages/$orgId.admin.settings.portals.tsx","/:orgId/admin/settings/portals"],["./pages/policies.$policyId.acknowledge.tsx","/policies/:policyId/acknowledge"],["./pages/$orgId.admin.policies.$policyId.tsx","/:orgId/admin/policies/:policyId"],["./pages/$orgId.admin.policies.$policyId.edit.tsx","/:orgId/admin/policies/:policyId/edit"],["./pages/portal.$portalSlug.policies.$policyId.tsx","/portal/:portalSlug/policies/:policyId"],["./pages/superadmin.login.tsx","/superadmin/login"],["./pages/superadmin.organizations.tsx","/superadmin/organizations"]]);
const fileNameToComponent = new Map([
    ["./pages/audit.tsx", Page_0],
["./pages/login.tsx", Page_1],
["./pages/users.tsx", Page_2],
["./pages/_index.tsx", Page_3],
["./pages/public.tsx", Page_4],
["./pages/internal.tsx", Page_5],
["./pages/policies.tsx", Page_6],
["./pages/settings.tsx", Page_7],
["./pages/dashboard.tsx", Page_8],
["./pages/users.create.tsx", Page_9],
["./pages/notifications.tsx", Page_10],
["./pages/organizations.tsx", Page_11],
["./pages/login.$orgSlug.tsx", Page_12],
["./pages/policies.create.tsx", Page_13],
["./pages/acknowledgements.tsx", Page_14],
["./pages/policy-templates.tsx", Page_15],
["./pages/settings.portals.tsx", Page_16],
["./pages/for-organizations.tsx", Page_17],
["./pages/$orgId.$portalSlug.tsx", Page_18],
["./pages/$orgId.admin.audit.tsx", Page_19],
["./pages/$orgId.admin.users.tsx", Page_20],
["./pages/policies.$policyId.tsx", Page_21],
["./pages/portal.$portalSlug.tsx", Page_22],
["./pages/$orgId.admin.policies.tsx", Page_23],
["./pages/$orgId.admin.settings.tsx", Page_24],
["./pages/register-organization.tsx", Page_25],
["./pages/$orgId.admin.dashboard.tsx", Page_26],
["./pages/policies.$policyId.edit.tsx", Page_27],
["./pages/$orgId.admin.users.create.tsx", Page_28],
["./pages/$orgId.admin.notifications.tsx", Page_29],
["./pages/$orgId.$portalSlug.$policyId.tsx", Page_30],
["./pages/$orgId.admin.policies.create.tsx", Page_31],
["./pages/$orgId.admin.acknowledgements.tsx", Page_32],
["./pages/$orgId.admin.policy-templates.tsx", Page_33],
["./pages/$orgId.admin.settings.portals.tsx", Page_34],
["./pages/policies.$policyId.acknowledge.tsx", Page_35],
["./pages/$orgId.admin.policies.$policyId.tsx", Page_36],
["./pages/$orgId.admin.policies.$policyId.edit.tsx", Page_37],
["./pages/portal.$portalSlug.policies.$policyId.tsx", Page_38],
["./pages/$orgId.admin.handbook.tsx", Page_39],
["./pages/$orgId.admin.faq.tsx", Page_40],
["./pages/$orgId.admin.assistant.tsx", Page_41],
["./pages/forgot-password.tsx", Page_42],
["./pages/reset-password.tsx", Page_43],
["./pages/superadmin.login.tsx", Page_44],
["./pages/superadmin.organizations.tsx", Page_45],
  ]);

function makePageRoute(filename: string) {
  const Component = fileNameToComponent.get(filename);
  return <Component />;
}

function toElement({
  trie,
  fileNameToRoute,
  makePageRoute,
}: {
  trie: LayoutTrie;
  fileNameToRoute: Map<string, string>;
  makePageRoute: (filename: string) => React.ReactNode;
}) {
  return [
    ...trie.topLevel.map((filename) => (
      <Route
        key={fileNameToRoute.get(filename)}
        path={fileNameToRoute.get(filename)}
        element={makePageRoute(filename)}
      />
    )),
    ...Array.from(trie.trie.entries()).map(([Component, child], index) => (
      <Route
        key={index}
        element={
          <Component>
            <Outlet />
          </Component>
        }
      >
        {toElement({ trie: child, fileNameToRoute, makePageRoute })}
      </Route>
    )),
  ];
}

type LayoutTrieNode = Map<
  React.ComponentType<{ children: React.ReactNode }>,
  LayoutTrie
>;
type LayoutTrie = { topLevel: string[]; trie: LayoutTrieNode };
function buildLayoutTrie(layouts: {
  [fileName: string]: React.ComponentType<{ children: React.ReactNode }>[];
}): LayoutTrie {
  const result: LayoutTrie = { topLevel: [], trie: new Map() };
  Object.entries(layouts).forEach(([fileName, components]) => {
    let cur: LayoutTrie = result;
    for (const component of components) {
      if (!cur.trie.has(component)) {
        cur.trie.set(component, {
          topLevel: [],
          trie: new Map(),
        });
      }
      cur = cur.trie.get(component)!;
    }
    cur.topLevel.push(fileName);
  });
  return result;
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Go back to the <a href="/" style={{ color: 'blue' }}>home page</a>.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          {toElement({ trie: buildLayoutTrie({
"./pages/audit.tsx": PageLayout_0,
"./pages/login.tsx": PageLayout_1,
"./pages/users.tsx": PageLayout_2,
"./pages/_index.tsx": PageLayout_3,
"./pages/public.tsx": PageLayout_4,
"./pages/internal.tsx": PageLayout_5,
"./pages/policies.tsx": PageLayout_6,
"./pages/settings.tsx": PageLayout_7,
"./pages/dashboard.tsx": PageLayout_8,
"./pages/users.create.tsx": PageLayout_9,
"./pages/notifications.tsx": PageLayout_10,
"./pages/organizations.tsx": PageLayout_11,
"./pages/login.$orgSlug.tsx": PageLayout_12,
"./pages/policies.create.tsx": PageLayout_13,
"./pages/acknowledgements.tsx": PageLayout_14,
"./pages/policy-templates.tsx": PageLayout_15,
"./pages/settings.portals.tsx": PageLayout_16,
"./pages/for-organizations.tsx": PageLayout_17,
"./pages/$orgId.$portalSlug.tsx": PageLayout_18,
"./pages/$orgId.admin.audit.tsx": PageLayout_19,
"./pages/$orgId.admin.users.tsx": PageLayout_20,
"./pages/policies.$policyId.tsx": PageLayout_21,
"./pages/portal.$portalSlug.tsx": PageLayout_22,
"./pages/$orgId.admin.policies.tsx": PageLayout_23,
"./pages/$orgId.admin.settings.tsx": PageLayout_24,
"./pages/register-organization.tsx": PageLayout_25,
"./pages/$orgId.admin.dashboard.tsx": PageLayout_26,
"./pages/policies.$policyId.edit.tsx": PageLayout_27,
"./pages/$orgId.admin.users.create.tsx": PageLayout_28,
"./pages/$orgId.admin.notifications.tsx": PageLayout_29,
"./pages/$orgId.$portalSlug.$policyId.tsx": PageLayout_30,
"./pages/$orgId.admin.policies.create.tsx": PageLayout_31,
"./pages/$orgId.admin.acknowledgements.tsx": PageLayout_32,
"./pages/$orgId.admin.policy-templates.tsx": PageLayout_33,
"./pages/$orgId.admin.settings.portals.tsx": PageLayout_34,
"./pages/policies.$policyId.acknowledge.tsx": PageLayout_35,
"./pages/$orgId.admin.policies.$policyId.tsx": PageLayout_36,
"./pages/$orgId.admin.policies.$policyId.edit.tsx": PageLayout_37,
"./pages/portal.$portalSlug.policies.$policyId.tsx": PageLayout_38,
"./pages/$orgId.admin.handbook.tsx": PageLayout_39,
"./pages/$orgId.admin.faq.tsx": PageLayout_40,
"./pages/$orgId.admin.assistant.tsx": PageLayout_41,
"./pages/forgot-password.tsx": PageLayout_42,
"./pages/reset-password.tsx": PageLayout_43,
"./pages/superadmin.login.tsx": PageLayout_44,
"./pages/superadmin.organizations.tsx": PageLayout_45,
}), fileNameToRoute, makePageRoute })} 
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
