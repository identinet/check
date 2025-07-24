/**
 * Tests whether the verifiable credential is of a certain type.
 * @type {(object, string) => boolean}
 * @param {object} vc - Verifiable Credential.
 * @param {string} t - Type.
 * @returns {boolean} Whether VC is of this type.
 */
export function isType(vc, t) {
  return (vc?.type || []).includes(t);
}

const options = { day: "2-digit", month: "2-digit", year: "numeric" };
const dateTimeFormat = new Intl.DateTimeFormat(navigator.language, options);

const knownIssuers = {
  "did:web:identinet.io": "identinet GmbH",
  "did:web:demo-shop.check.identinet.io": "Demo Shop",
  "did:web:evil-demo-shop.check.identinet.io": "Evil Demo Shop",
  "did:web:evil2-demo-shop.check.identinet.io": "Evil2 Demo Shop",
};
const knownIssuerIds = Object.keys(knownIssuers);
const toIssuer = (id) => {
  if (knownIssuerIds.includes(id)) {
    return knownIssuers[id];
  }
  return id;
};

export const credentialToRenderData = {
  "schema:Organization": (vc) => {
    const data = {
      title: "",
      issuer: "",
      value: "unknown",
    };
    data.title = "Registred Organization";
    data.issuer = toIssuer(vc?.issuer);

    const date = new Date(vc?.credentialSubject["schema:foundingDate"]);
    if (date) {
      data.value = dateTimeFormat.format(date);
    }
    return data;
  },
  "schema:ComputerStore": (vc) => {
    const data = {
      title: "",
      issuer: "",
      value: "unknown",
    };
    data.title = "Shop Location";
    data.issuer = toIssuer(vc?.issuer);

    const location = vc?.credentialSubject["schema:location"];
    if (location) {
      const city = location["schema:addressLocality"];
      const country = location["schema:addressCountry"];
      if (city && country) {
        data.value = [city, country].join(", ");
      }
    }
    return data;
  },
  "schema:MerchantReturnPolicy": (vc) => {
    const data = {
      title: "",
      issuer: "",
      value: "unknown",
    };
    data.title = "Return Policy";
    data.issuer = toIssuer(vc?.issuer);

    const returnmethod = vc?.credentialSubject["schema:returnMethod"]?.reduce(
      (acc, t) => {
        const v = { "ReturnByMail": "Mail", "ReturnInStore": "In store" }[t];
        if (v) {
          acc.push(v);
        }
        return acc;
      },
      [],
    ).join(" & ");
    const refundtype = vc?.credentialSubject["schema:refundType"]?.reduce(
      (acc, t) => {
        const v = { "FullRefund": "Full Refund" }[t];
        if (v) {
          acc.push(v);
        }
        return acc;
      },
      [],
    ).join(" & ");
    if (returnmethod && refundtype) {
      data.value = `${returnmethod} - ${refundtype}`;
    }
    return data;
  },
  "schema:Service": (vc) => {
    const data = {
      title: "",
      issuer: "",
      value: "unknown",
    };
    data.title = "Awards";
    data.issuer = toIssuer(vc?.issuer);

    const award = vc?.credentialSubject["schema:award"];
    if (award) {
      data.value = award;
    }
    return data;
  },
};

const knownTypes = Object.keys(credentialToRenderData);

/**
 * Tests if a credendial has a known type that can be rendered.
 */
export function hasKnownType(vc) {
  for (let i = 0; i < knownTypes.length; i++) {
    if (isType(vc, knownTypes[i])) {
      return [true, knownTypes[i]];
    }
  }
  return [false, null];
}
