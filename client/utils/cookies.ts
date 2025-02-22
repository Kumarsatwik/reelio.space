export const removeCookies = () => {
  const cookies = ["token", "refreshToken"];
  const domains = [window.location.hostname, ""];
  const paths = ["/", ""];

  cookies.forEach((cookie) => {
    domains.forEach((domain) => {
      paths.forEach((path) => {
        document.cookie = `${cookie}=; path=${path}${
          domain ? `; domain=${domain}` : ""
        }; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
      });
    });
  });
};
