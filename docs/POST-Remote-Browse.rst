POST Remote Browse
==================

.. http:post:: /remotes/(sid)/browse(path)

  Uses an existing remote session to retrieve remote filesystem information.
  The session must have been created successfully using :http:post:`/remotes`.
  The caller *may* supply additional parameters to filter directories and files
  in the results, based on regular expressions.

  :param sid: Unique remote session identifier.
  :type sid: string

  :param path: Remote filesystem path (must be absolute).
  :type path: string

  :requestheader Content-Type: application/json

  :<json string directory-reject: Optional regular expression for filtering directories.
  :<json string directory-allow: Optional regular expression for retaining directories.
  :<json string file-reject: Optional regular expression for filtering files.
  :<json string file-allow: Optional regular expression for allowing files.

  :responseheader Content-Type: application/json

  :>json string path: Remote filesystem path
  :>json array names: Array of string filenames contained within the remote filesystem path.
  :>json array sizes: Array of integer file sizes.
  :>json array types: Array of string file types, "f" for regular files, "d" for directories.
  :>json array mtimes: Array of string file modification times, in ISO-8601 format.

  :status 200: The response contains the requested browsing information.
  :status 400: The remote access failed.
  :status 404: The remote session ID was invalid or expired.

  The regular expression parameters are matched against full file / directory
  paths.  If a file / directory matches a reject expression, it will not be
  included in the results, unless it also matches an allow expression.  So, to
  remove JPEG files from the results::

    file-reject: "[.]jpg$|[.]jpeg$"

  but to only return CSV files::

    file-reject: ".*",
    file-allow: "[.]csv$"

  **Sample Request**

  .. sourcecode:: http

    POST /remotes/505d0e463d5ed4a32bb6b0fe9a000d36/browse/home/fred

    {
      file-reject: "[.]jpg$"
    }

  Sample Response

  .. sourcecode:: http

    {
      "path" : "/home/fred",
      "names" : ["a.txt", "b.png", "c.csv", "subdir"],
      "sizes" : [1264, 456730, 78005, 4096],
      "types' : ["f", "f", "f", "d"],
      "mtimes" : ["2015-03-03T16:52:34.599466", "2015-03-02T21:03:50", "2015-03-02T21:03:50", "2015-03-02T21:03:50", "2015-03-03T16:04:42.899485"],
    }

See Also
--------

* :http:post:`/remotes`
* :http:get:`/remotes/(sid)/file(path)`
* :http:get:`/remotes/(sid)/image(path)`

