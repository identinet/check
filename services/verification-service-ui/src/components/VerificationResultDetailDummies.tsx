export function VerificationResultDetailSuccess(claims = true) {
  return (
    <div class="text-left">
      <table class="table table-sm table-zebra">
        <tbody>
          <tr>
            <th class="p-0 pt-2 pb-1 text-bold">Result</th>
            <th class="p-0 pt-2 pb-1"></th>
          </tr>
          <tr>
            <td class="p-0">Credential</td>
            <td class="p-0 px-2">No credential ID.</td>
          </tr>
          <tr>
            <td class="p-0">Subject</td>
            <td class="p-0 px-2">did:web:id-plus-example.identinet.io</td>
          </tr>
          <tr>
            <td class="p-0">Issuer</td>
            <td class="p-0 px-2">did:web:id-plus-example.identinet.io</td>
          </tr>
          <tr>
            <td class="p-0">Issued</td>
            <td class="p-0 px-2">Apr 11, 2024, 2:41:33 PM</td>
          </tr>
          {claims && (
            <>
              <tr>
                <th class="p-0 pt-2 pb-1 text-bold">Claims</th>
                <th class="p-0 pt-2 pb-1"></th>
              </tr>
              <tr>
                <td class="p-0">VatID</td>
                <td class="p-0 px-2">987654321</td>
              </tr>
              <tr>
                <td class="p-0">TaxID</td>
                <td class="p-0 px-2">132456789</td>
              </tr>
              <tr>
                <td class="p-0">LeiCode</td>
                <td class="p-0 px-2">54321</td>
              </tr>
              <tr>
                <td class="p-0">LegalName</td>
                <td class="p-0 px-2">Example Company LLC</td>
              </tr>
              <tr>
                <td class="p-0">Location</td>
                <td class="p-0 px-2">1 Example Street, 12345 Example City</td>
              </tr>
              <tr>
                <td class="p-0">Telephone</td>
                <td class="p-0 px-2">+123456789</td>
              </tr>
              <tr>
                <td class="p-0">Email</td>
                <td class="p-0 px-2">support@example.com</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function VerificationResultDetailNotVerified() {
  return (
    <table class="table table-sm table-zebra">
      <tbody>
        <tr>
          <th class="p-0 pt-2 pb-1 text-bold">Result</th>
          <th class="p-0 pt-2 pb-1"></th>
        </tr>
        <tr>
          <td class="p-0">Credential</td>
          <td class="p-0 px-2">No credential ID.</td>
        </tr>
        <tr>
          <td class="p-0">Subject</td>
          <td class="p-0 px-2">did:web:broken-example.identinet.io</td>
        </tr>
        <tr>
          <td class="p-0">Issuer</td>
          <td class="p-0 px-2">did:web:broken-example.identinet.io</td>
        </tr>
        <tr>
          <td class="p-0">Issued</td>
          <td class="p-0 px-2">Apr 6, 2024, 6:42:36 PM</td>
        </tr>
        <tr>
          <th class="p-0 pt-2 pb-1 text-bold">Claims</th>
          <th class="p-0 pt-2 pb-1"></th>
        </tr>
        <tr>
          <td class="p-0">Tampered</td>
          <td class="p-0 px-2">attribute</td>
        </tr>
      </tbody>
    </table>
  );
}
