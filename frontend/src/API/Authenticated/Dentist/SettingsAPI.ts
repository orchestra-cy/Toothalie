export async function updateSettingsDentist(schedules: any[]) {
  console.log("Sending schedules:", schedules);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  try {
    const result = await fetch(
      "/api/update-dentist-settings",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${userInfo.token}`,
        },

        body: JSON.stringify({ schedules }),
      },
    );

    // if (!result.ok) {
    //   throw new Error(`Error ${result.status}`);
    // }

    const data = await result.json();

    console.log("API response:", data);

    return data;
  } catch (error) {
    console.error("Failed to update dentist settings:", error);
    return error
  }
}

export async function getServices() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const result = await fetch("/api/get-services", {
    method: "GET",

    headers: {
      Authorization: `Bearer ${userInfo.token}`,
    },
  });

  const data = await result.json();

  console.log(data);

  return data;
}

export async function getDentistServices() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const result = await fetch("/api/get-dentist-service", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${userInfo.token}`,
    },
  });

  const data = result.json();

  console.log(data);

  return data;
}

export async function updateDentistServices(payload: { service_id: number }[]) {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  console.log(payload);

  const data = await fetch("/api/edit-services", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${userInfo.token}`,
    },

    body: JSON.stringify({ payload }),
  });

  const result = await data.json();

  console.log(result);
}
