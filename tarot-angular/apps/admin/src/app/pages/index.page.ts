import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RouteMeta } from "@analogjs/router";

export const routeMeta: RouteMeta = {
  title: "Tarot News Admin",
};

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="login-page">
      <a routerLink="/admin">Go to admin dashboard</a>
    </div>
  `,
})
export default class IndexPage {}
