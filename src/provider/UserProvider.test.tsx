import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { setInStorage, removeInStorage } from "ssr-safe-storage"
import { UserProvider } from "./UserProvider"
import useUserContext from "./useUserContext"
import { keyStorageUser, userKey } from "@/storageKeys"
import { buildToken, expiresIn } from "@/test/buildToken"

const alice = { "@id": "/users/1", firstName: "A", lastName: "B", email: "a@b.c" }

const Probe = () => {
  const { user } = useUserContext()
  return <p data-testid="email">{user?.email ?? "none"}</p>
}

const renderProvider = (getUser = vi.fn().mockResolvedValue(alice)) =>
  render(
    <UserProvider context={{ getUser, logout: vi.fn() } as never}>
      <Probe />
    </UserProvider>
  )

const fire = (key: string | null) =>
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }))
  })

describe("UserProvider storage sync", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("clears the user when another tab logs out", async () => {
    setInStorage(keyStorageUser, { token: buildToken({ exp: expiresIn(600) }) })
    setInStorage(userKey, alice)
    renderProvider()
    await screen.findByText("a@b.c")

    removeInStorage(keyStorageUser)
    removeInStorage(userKey)
    fire(keyStorageUser)

    expect(screen.getByTestId("email").textContent).toBe("none")
  })

  it("loads the user when another tab logs in", async () => {
    renderProvider()
    expect(screen.getByTestId("email").textContent).toBe("none")

    setInStorage(keyStorageUser, { token: buildToken({ exp: expiresIn(600) }) })
    setInStorage(userKey, alice)
    fire(userKey)

    expect(await screen.findByText("a@b.c")).toBeTruthy()
  })

  it("ignores unrelated keys and removes its listener on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener")
    const { unmount } = renderProvider()
    fire("other")
    unmount()
    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function))
  })
})
