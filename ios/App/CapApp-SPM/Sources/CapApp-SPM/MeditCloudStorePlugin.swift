import Capacitor
import Foundation

@objc(MeditCloudStorePlugin)
public class MeditCloudStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MeditCloudStorePlugin"
    public let jsName = "MeditCloudStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
    ]

    private let defaults = UserDefaults.standard
    private let cloudStore = NSUbiquitousKeyValueStore.default

    override public func load() {
        cloudStore.synchronize()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Missing key")
            return
        }

        let cloudAvailable = isCloudAvailable()
        let cloudValue = cloudAvailable ? cloudStore.string(forKey: key) : nil
        let localValue = defaults.string(forKey: key)
        let resolvedValue = cloudValue ?? localValue

        if let value = resolvedValue, localValue != value {
            defaults.set(value, forKey: key)
        }

        call.resolve([
            "value": resolvedValue as Any,
            "cloudAvailable": cloudAvailable,
        ])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Missing key")
            return
        }

        guard let value = call.getString("value") else {
            call.reject("Missing value")
            return
        }

        let cloudAvailable = isCloudAvailable()

        defaults.set(value, forKey: key)

        if cloudAvailable {
            cloudStore.set(value, forKey: key)
            cloudStore.synchronize()
        }

        call.resolve([
            "cloudAvailable": cloudAvailable,
        ])
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Missing key")
            return
        }

        defaults.removeObject(forKey: key)
        cloudStore.removeObject(forKey: key)
        cloudStore.synchronize()

        call.resolve()
    }

    private func isCloudAvailable() -> Bool {
        return FileManager.default.ubiquityIdentityToken != nil
    }
}
