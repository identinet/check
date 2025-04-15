function go() {
  console.log("moinsen");
  alert("some alert");
  try {
    fetch("https://heise.de").then((res) => console.log("res", res));
  } catch (err) {
    console.error("err", err);
  }
}

go();
